'use strict';

import * as dotenv from 'dotenv';
dotenv.config();

import { join } from 'path';
import { composeUp, composeDown } from '../docker.js';

export const setup = async () => {
  const [provider, accessKeyId, secretAccessKey, endpoint, region] = process.env.BUCKET_ENV_MINIO.split(',');
  if (!provider || !accessKeyId || !secretAccessKey || !endpoint || !region) {
    throw new Error('BUCKET_ENV_MINIO is not set correctly');
  }
  process.env.MINIO_ROOT_USER = accessKeyId;
  process.env.MINIO_ROOT_PASSWORD = secretAccessKey;
  console.log(`⏫  starting minio image …`);
  await composeUp(join(process.cwd(), 'tests', 'compose.minio.yaml'));
};
export const teardown = async () => {
  await composeDown(join(process.cwd(), 'tests', 'compose.minio.yaml'));
  return 0;
};
