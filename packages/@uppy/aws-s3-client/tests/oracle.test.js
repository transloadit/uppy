'use strict';
import { beforeRun } from './_shared.test.js';

import * as dotenv from 'dotenv';
dotenv.config();

const name = 'oracle';
const bucketName = `BUCKET_ENV_${name.toUpperCase()}`;

const raw = process.env[bucketName] ? process.env[bucketName].split(',') : null;

beforeRun(raw, name);
