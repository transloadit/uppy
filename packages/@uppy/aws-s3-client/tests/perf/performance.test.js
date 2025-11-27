'use strict';
import {
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import * as Minio from 'minio';
import awsLite from '@aws-lite/client';
import { S3mini } from '../../dist/s3mini.min.js';
// import { S3mini as S3miniOld } from 's3mini';
import { Bench } from 'tinybench';
import { printTable } from 'console-table-printer';
import { randomBytes, randomUUID } from 'node:crypto';
import { finished } from 'node:stream/promises';

import { setup, teardown } from './performance.config.js';

import * as dotenv from 'dotenv';

dotenv.config();
const now = new Date();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const credentials = process.env.BUCKET_ENV_MINIO.split(',');
const [provider, ACCESS_KEY, SECRET_KEY, ENDPOINT, REGION] = credentials;
if (!provider || !ACCESS_KEY || !SECRET_KEY || !ENDPOINT || !REGION) {
  throw new Error('BUCKET_ENV_MINIO is not set correctly');
}

const BUCKET_NAME = ENDPOINT.split('/')[3];
const BUCKET = BUCKET_NAME || 'core-s3-dev-local';

const SIZES = {
  small: { key: 'bench-1MiB' + now.getTime(), buf: randomBytes(1 * 1024 * 1024) },
  medium: { key: 'bench-8MiB' + now.getTime(), buf: randomBytes(8 * 1024 * 1024) },
};
// large: { key: 'bench-100MiB' + now, buf: randomBytes(100 * 1024 * 1024) },

const collectStreamHelper = async source => {
  const readable = typeof source === 'function' ? source() : source;

  const chunks = [];
  readable.on('data', chunk => chunks.push(chunk));

  // Wait for 'end' or 'error'.
  await finished(readable, { cleanup: true });

  return readable.readableObjectMode
    ? chunks // object stream → array of objects
    : Buffer.concat(chunks); // binary stream → single Buffer
};

const { origin: BASE_ENDPOINT } = new URL(ENDPOINT);
const makeAws = () => {
  const client = new S3Client({
    region: REGION,
    endpoint: BASE_ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    forcePathStyle: true,
  });
  return {
    name: 'aws-sdk-v3',
    get: k => client.send(new GetObjectCommand({ Bucket: BUCKET, Key: k })),
    put: (k, b) => client.send(new PutObjectCommand({ Bucket: BUCKET, Key: k, Body: b })),
    list: () => client.send(new ListObjectsV2Command({ Bucket: BUCKET })),
    del: k => client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: k })),
  };
};

const makeMinio = () => {
  const client = new Minio.Client({
    endPoint: new URL(ENDPOINT).hostname,
    port: Number(new URL(ENDPOINT).port),
    useSSL: ENDPOINT.startsWith('https'),
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    forcePathStyle: true,
  });
  return {
    name: 'minio-js',
    get: k => collectStreamHelper(cb => client.getObject(BUCKET, k, cb)),
    put: (k, b) => client.putObject(BUCKET, k, b, b.length), // :contentReference[oaicite:1]{index=1}
    list: () => collectStreamHelper(() => client.listObjectsV2(BUCKET)),
    del: k => client.removeObject(BUCKET, k),
  };
};

const makeAwsLite = async () => {
  const client = await awsLite({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
    endpoint: BASE_ENDPOINT,
    region: REGION,
    plugins: [import('@aws-lite/s3')],
  });
  return {
    name: 'aws-lite',
    get: k =>
      client.S3.GetObject({
        Bucket: BUCKET,
        Key: k,
      }),
    put: (k, b) =>
      client.S3.PutObject({
        Bucket: BUCKET,
        Key: k,
        Body: b,
      }),
    list: () => client.S3.ListObjectsV2({ Bucket: BUCKET }),
    del: k =>
      client.S3.DeleteObject({
        Bucket: BUCKET,
        Key: k,
      }),
  };
};

const makeS3mini = () => {
  const client = new S3mini({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
    endpoint: ENDPOINT,
    region: 'auto',
  });
  return {
    name: 's3mini',
    get: k => client.getObject(k),
    put: (k, b) => client.putObject(k, b),
    list: () => client.listObjects('/'),
    del: k => client.deleteObject(k),
  };
};

// const makeS3miniOld = () => {
//   const client = new S3miniOld({
//     accessKeyId: ACCESS_KEY,
//     secretAccessKey: SECRET_KEY,
//     endpoint: ENDPOINT,
//     region: 'auto',
//   });
//   return {
//     name: 's3mini old',
//     get: k => client.getObject(k),
//     put: (k, b) => client.putObject(k, b),
//     list: () => client.listObjects('/'),
//     del: k => client.deleteObject(k),
//   };
// };

const s3minichecker = new S3mini({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  endpoint: ENDPOINT,
  region: 'auto',
});
const ensureBucket = async adapter => {
  const bucketExists = await s3minichecker.bucketExists();
  if (!bucketExists) {
    await s3minichecker.createBucket();
  }
  try {
    await adapter.put('__probe', Buffer.from('hi'));
    await adapter.del('__probe');
  } catch {
    throw new Error(`Bucket "${BUCKET}" must exist and be writable`);
  }
};

const runSuite = async () => {
  console.log(`Running performance tests against bucket "${BUCKET}"`);
  const sdks = [makeAws(), makeS3mini(), makeMinio(), await makeAwsLite() /* makeS3miniOld() */];

  for (const [label, { key, buf }] of Object.entries(SIZES)) {
    const bench = new Bench({ iterations: 100, time: 0 });
    for (const sdk of sdks) {
      await ensureBucket(sdk);
      bench.add(`${sdk.name}`, async task => {
        const thisKey = `${key}-${randomUUID()}`;
        await sdk.put(thisKey, buf);
        await sdk.list();
        await sdk.del(thisKey);
      });
    }
    console.log(`\n=== ${label.toUpperCase()} (${(buf.length / 1024 / 1024) | 0} MiB) ===`);
    await bench.run();
    // const cli = tinybenchPrinter.toCli(bench);
    console.log(bench.name);
    printTable(bench.table());
  }
};

await setup();
await sleep(3000); // wait for the server to start
process.on('exit', async () => {
  await teardown();
});

await runSuite().catch(err => (console.error(err), process.exit(1)));
