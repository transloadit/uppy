'use strict';
import { it, vi } from 'vitest';
import { S3mini } from '../src/index.js';
import { beforeRun, resetBucketBeforeAll } from './_shared.test.js';

import * as dotenv from 'dotenv';
dotenv.config();

const name = 'ceph';
const bucketName = `BUCKET_ENV_${name.toUpperCase()}`;

const raw = process.env[bucketName] ? process.env[bucketName].split(',') : null;

const cephSpecific = bucket => {
  vi.setConfig({testTimeout: 120_000});

  const s3client = new S3mini({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    endpoint: bucket.endpoint,
    region: bucket.region,
  });

  resetBucketBeforeAll(s3client);

  it('put object with canned x-amz-acl', async () => {
    const fileContents = Buffer.from('Some private file contents.', 'utf-8');

    const privateObjectResult = await s3client.putObject('martijn/private.txt', fileContents, 'text/plain', undefined, {
      'x-amz-acl': 'private',
    });

    expect(privateObjectResult.ok).toBe(true);

    const privateObjectACL = await s3client._signedRequest("GET", 'martijn/private.txt', {
      query: { acl: '' },
    });

    expect(privateObjectACL.ok).toBe(true);

    const xmlPrivateObjectACL = (await privateObjectACL.text()).match(/<Grant>.+?<\/Grant>/g);

    expect(xmlPrivateObjectACL.length).toBe(1);
    expect(xmlPrivateObjectACL.some((grant) => {
      return grant.includes('<Permission>FULL_CONTROL</Permission>');
    })).toBe(true);
    expect(xmlPrivateObjectACL.some((grant) => {
      return grant.includes('<Permission>READ</Permission>');
    })).toBe(false);


    const publicObjectResult = await s3client.putObject('martijn/public.txt', fileContents, 'text/plain', undefined, {
      'x-amz-acl': 'public-read',
    });

    expect(publicObjectResult.ok).toBe(true);

    const publicObjectACL = await s3client._signedRequest("GET", 'martijn/public.txt', {
      query: { acl: '' },
    });

    expect(publicObjectACL.ok).toBe(true);

    const xmlPublicObjectACL = (await publicObjectACL.text()).match(/<Grant>.+?<\/Grant>/g);

    expect(xmlPublicObjectACL.length).toBe(2);
    expect(xmlPublicObjectACL.some((grant) => {
      return grant.includes('<Permission>FULL_CONTROL</Permission>');
    })).toBe(true);
    expect(xmlPublicObjectACL.some((grant) => {
      return grant.includes('<Permission>READ</Permission>');
    })).toBe(true);
  });
};

beforeRun(raw, name, cephSpecific);
