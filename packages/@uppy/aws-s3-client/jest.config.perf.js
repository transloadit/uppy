export default {
  displayName: 's3mini performance test',
  testTimeout: 10000,
  silent: false,
  verbose: true,
  collectCoverage: false,
  testEnvironment: 'node',
  maxWorkers: 'auto',
  transform: {},
  testMatch: ['<rootDir>/tests/perf/performance.test.js'],
};
