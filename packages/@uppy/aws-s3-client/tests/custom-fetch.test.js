'use strict';
import { it, expect } from 'vitest';
import { S3mini } from '../src/index.js';
import { beforeRun } from './_shared.test.js';

import * as dotenv from 'dotenv';
dotenv.config();

const name = 'minio';
const bucketName = `BUCKET_ENV_${name.toUpperCase()}`;

const raw = process.env[bucketName] ? process.env[bucketName].split(',') : null;

const customFetchTests = bucket => {
  vi.setConfig({testTimeout: 120_000});

  it('uses custom fetch implementation', async () => {
    // Track fetch calls
    const fetchCalls = [];

    // Create a custom fetch that wraps the global fetch and tracks calls
    const customFetch = async (url, options) => {
      fetchCalls.push({ url, method: options?.method || 'GET' });
      return globalThis.fetch(url, options);
    };

    const s3client = new S3mini({
      accessKeyId: bucket.accessKeyId,
      secretAccessKey: bucket.secretAccessKey,
      endpoint: bucket.endpoint,
      region: bucket.region,
      fetch: customFetch,
    });

    // Perform a simple operation
    const testKey = 'custom-fetch-test.txt';
    const testContent = 'Testing custom fetch implementation';

    // Reset fetchCalls before testing
    fetchCalls.length = 0;

    // Put an object
    await s3client.putObject(testKey, testContent);

    // Verify custom fetch was called for PUT
    expect(fetchCalls.length).toBeGreaterThan(0);
    const putCall = fetchCalls.find(call => call.method === 'PUT');
    expect(putCall).toBeDefined();
    expect(putCall.url).toContain(testKey);

    // Reset fetchCalls
    fetchCalls.length = 0;

    // Get the object
    const data = await s3client.getObject(testKey);
    expect(data).toBe(testContent);

    // Verify custom fetch was called for GET
    expect(fetchCalls.length).toBeGreaterThan(0);
    const getCall = fetchCalls.find(call => call.method === 'GET');
    expect(getCall).toBeDefined();
    expect(getCall.url).toContain(testKey);

    // Clean up
    await s3client.deleteObject(testKey);
  });

  it('custom fetch can modify request behavior', async () => {
    // Create a custom fetch that adds a custom header
    const customHeaderValue = 'custom-test-value-' + Date.now();
    let customHeaderSent = false;

    const customFetch = async (url, options) => {
      const modifiedOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-Custom-Test-Header': customHeaderValue,
        },
      };

      // Check if our custom header is in the request
      if (modifiedOptions.headers['X-Custom-Test-Header'] === customHeaderValue) {
        customHeaderSent = true;
      }

      return globalThis.fetch(url, modifiedOptions);
    };

    const s3client = new S3mini({
      accessKeyId: bucket.accessKeyId,
      secretAccessKey: bucket.secretAccessKey,
      endpoint: bucket.endpoint,
      region: bucket.region,
      fetch: customFetch,
    });

    // Perform an operation
    const exists = await s3client.bucketExists();

    // Verify our custom fetch was used (custom header was sent)
    expect(customHeaderSent).toBe(true);
    expect(exists).toBeDefined();
  });

  it('custom fetch can implement retry logic', async () => {
    let attemptCount = 0;
    const maxRetries = 2;

    // Create a custom fetch that retries on failure
    const retryingFetch = async (url, options) => {
      for (let i = 0; i <= maxRetries; i++) {
        attemptCount++;
        try {
          const response = await globalThis.fetch(url, options);
          // If successful or it's a non-retryable error, return
          if (response.ok || i === maxRetries) {
            return response;
          }
          // Wait a bit before retrying (simple exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
        } catch (error) {
          if (i === maxRetries) {
            throw error;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
        }
      }
    };

    const s3client = new S3mini({
      accessKeyId: bucket.accessKeyId,
      secretAccessKey: bucket.secretAccessKey,
      endpoint: bucket.endpoint,
      region: bucket.region,
      fetch: retryingFetch,
    });

    // Reset attempt count
    attemptCount = 0;

    // Perform a simple operation that should succeed on first try
    const exists = await s3client.bucketExists();

    // Should have been called at least once
    expect(attemptCount).toBeGreaterThanOrEqual(1);
    expect(exists).toBeDefined();
  });

  it('defaults to globalThis.fetch when no custom fetch provided', async () => {
    // Create client without custom fetch
    const s3client = new S3mini({
      accessKeyId: bucket.accessKeyId,
      secretAccessKey: bucket.secretAccessKey,
      endpoint: bucket.endpoint,
      region: bucket.region,
      // No fetch parameter - should use default
    });

    // Verify the client uses globalThis.fetch
    expect(s3client.fetch).toBe(globalThis.fetch);

    // Verify it works
    const exists = await s3client.bucketExists();
    expect(exists).toBeDefined();
  });

  it('custom fetch can log requests for debugging', async () => {
    const requestLog = [];

    // Create a logging fetch
    const loggingFetch = async (url, options) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: options?.method || 'GET',
        url: url.toString(),
        hasBody: !!options?.body,
      };
      requestLog.push(logEntry);

      return globalThis.fetch(url, options);
    };

    const s3client = new S3mini({
      accessKeyId: bucket.accessKeyId,
      secretAccessKey: bucket.secretAccessKey,
      endpoint: bucket.endpoint,
      region: bucket.region,
      fetch: loggingFetch,
    });

    // Clear log
    requestLog.length = 0;

    // Perform some operations
    const testKey = 'logging-test.txt';
    await s3client.putObject(testKey, 'test content');
    await s3client.getObject(testKey);
    await s3client.deleteObject(testKey);

    // Verify requests were logged
    expect(requestLog.length).toBeGreaterThan(0);

    // Check we logged different methods
    const methods = [...new Set(requestLog.map(log => log.method))];
    expect(methods.length).toBeGreaterThan(1);
    expect(methods).toContain('PUT');
    expect(methods).toContain('GET');
  });
};

beforeRun(raw, name, customFetchTests);
