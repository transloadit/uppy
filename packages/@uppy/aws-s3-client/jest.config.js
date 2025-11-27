import * as dotenv from 'dotenv';
dotenv.config();

const buckets = Object.keys(process.env)
  .filter(k => k.startsWith('BUCKET_ENV_'))
  .map(k => {
    const [provider, accessKeyId, secretAccessKey, endpoint, region] = process.env[k].split(',');
    return { provider, accessKeyId, secretAccessKey, endpoint, region };
  });

console.log(
  'Providers found: ',
  buckets.map(b => b.provider),
);

if (buckets.length === 0) {
  console.error('No buckets found. Please set the BUCKET_ENV_ environment variables.');
  process.exit(1);
}

export default {
  displayName: 's3mini full test',
  silent: false,
  verbose: true,
  collectCoverage: false,
  testEnvironment: 'node',
  workerThreads: true,
  maxConcurrency: 5,
  maxWorkers: '80%',
  testTimeout: 120_000,
  globalSetup: '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/teardown.js',
  projects: buckets.map((bucket, index) => ({
    displayName: `Test: ${bucket.provider}`,
    testMatch: [`<rootDir>/tests/${bucket.provider}.test.js`],
  })),
};
