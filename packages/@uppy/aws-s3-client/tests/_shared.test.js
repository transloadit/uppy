'use strict';
import { vi, it, expect, describe } from 'vitest';
import { S3mini, sanitizeETag, runInBatches } from '../src/index.js';
import { randomBytes } from 'node:crypto';
import { beforeAll } from 'vitest'
import { createSigV4Signer } from '../src/sigv4-signer.js';

export const beforeRun = (raw, name, providerSpecific) => {
  if (!raw || raw === null) {
    console.error('No credentials found. Please set the BUCKET_ENV_ environment variables.');
    describe.skip(name, () => {
      it('skipped', () => {
        expect(true).toBe(true);
      });
    });
  } else {
    console.log('Running tests for bucket:', name);
    const credentials = {
      provider: raw[0],
      accessKeyId: raw[1],
      secretAccessKey: raw[2],
      endpoint: raw[3],
      region: raw[4],
    };
    describe(`:::: ${credentials.provider} ::::`, () => {
      expect(credentials.provider).toBe(name);
      providerName = credentials.provider;
      expect(credentials.accessKeyId).toBeDefined();
      expect(credentials.secretAccessKey).toBeDefined();
      expect(credentials.endpoint).toBeDefined();
      expect(credentials.region).toBeDefined();
      testRunner(credentials);
      if (providerSpecific) {
        providerSpecific(credentials);
      }
    });
  }
};

const EIGHT_MB = 8 * 1024 * 1024;

const large_buffer = randomBytes(EIGHT_MB * 3.2);

const byteSize = str => new Blob([str]).size;

const OP_CAP = 40;
let providerName;
const key = 'first-test-object.txt';
const contentString = 'Hello, world!';

const specialCharContentString = 'Hello, world! \uD83D\uDE00';
const specialCharContentBufferExtra = Buffer.from(specialCharContentString + ' extra', 'utf-8');
const specialCharKey = 'special-char key with spaces.txt';

export const resetBucketBeforeAll = s3client => {
  beforeAll(async () => {
    let exists;
    try {
      exists = await s3client.bucketExists();
    } catch (err) {
      // Backblaze accounts are locked to a region and may throw on HEAD
      console.warn(`Skipping bucketExists() pre-check: ${err}`);
      return;
    }
    if (exists) {
      const list = await s3client.listObjects();
      expect(list).toBeInstanceOf(Array);
      if (list.length > 0) {
        expect(list.length).toBeGreaterThan(0);

        await s3client.deleteObjects(list.map(obj => obj.Key));
      }
    }
  });
};

// --- 2 ■ A separate describe makes test output nicer -----------------------
export const testRunner = bucket => {
  vi.setConfig({testTimeout: 120_000});


  const signer = createSigV4Signer({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    region: bucket.region
  })

  const s3client = new S3mini({
    endpoint: bucket.endpoint,
    region: bucket.region,
    signRequest: signer
  });


  resetBucketBeforeAll(s3client);

  it('instantiates s3client', () => {
    expect(s3client).toBeInstanceOf(S3mini); // ← updated expectation
  });

  it('bucket exists', async () => {
    let exists = await s3client.bucketExists();
    if (!exists) {
      const createBucketResponse = await s3client.createBucket();
      expect(createBucketResponse).toBeDefined();
      exists = await s3client.bucketExists();
    }
    expect(exists).toBe(true);



  const nonExistentSigner = createSigV4Signer({
    accessKeyId: bucket.accessKeyId,
    secretAccessKey: bucket.secretAccessKey,
    region: bucket.region
  })

    const nonExistentBucket = new S3mini({
      endpoint: `${bucket.endpoint}/non-existent-bucket`,
      region: bucket.region,
      signRequest: nonExistentSigner
    });
    const nonExistent = await nonExistentBucket.bucketExists();
    expect(nonExistent).toBe(false);
  });

  it('basic list objects', async () => {
    const objects = await s3client.listObjects();
    expect(objects).toBeInstanceOf(Array);
    if (objects.length > 0) {
      for (const obj of objects) {
        await s3client.deleteObject(obj.Key);
      }
    }
    // Check if the bucket is empty
    const objects2 = await s3client.listObjects();
    expect(objects2).toBeInstanceOf(Array);
    expect(objects2.length).toBe(0);

    // listing non existent prefix thros 404 no such key
    const objectsWithPrefix = await s3client.listObjects('non-existent-prefix');
    expect(objectsWithPrefix).toBe(null);
  });

  it('basic put and get object', async () => {
    await s3client.putObject(key, contentString);
    const data = await s3client.getObject(key);
    expect(data).toBe(contentString);

    // Clean up
    const delResp = await s3client.deleteObject(key);
    expect(delResp).toBe(true);

    // Check if the object is deleted
    const deletedData = await s3client.getObject(key);
    expect(deletedData).toBe(null);

    if (providerName === 'cloudflare') {
      // Test Cloudflare SSE-C
      const ssecHeaders = {
        'x-amz-server-side-encryption-customer-algorithm': 'AES256',
        'x-amz-server-side-encryption-customer-key': 'n1TKiTaVHlYLMX9n0zHXyooMr026vOiTEFfT+719Hho=',
        'x-amz-server-side-encryption-customer-key-md5': 'gepZmzgR7Be/1+K1Aw+6ow==',
      };
      const response = await s3client.putObject(key, contentString, undefined, ssecHeaders);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const getObjectResponse = await s3client.getObject(key, {}, ssecHeaders);
      expect(getObjectResponse).toBeDefined();
      expect(getObjectResponse).toBe(contentString);

      const wrongSsecHeaders = {
        'x-amz-server-side-encryption-customer-algorithm': 'AES256',
        'x-amz-server-side-encryption-customer-key': 'wrong-key',
        'x-amz-server-side-encryption-customer-key-md5': 'wrong-md5',
      };
      try {
        const wrongResponse = await s3client.getObject(key, {}, wrongSsecHeaders);
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).toContain('400 – InvalidArgument');
      }

      try {
        const wrongResponse = await s3client.getObject(key);
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).toContain('400 – InvalidRequest');
      }

      // Clean up
      const delRespSsec = await s3client.deleteObject(key);
      expect(delRespSsec).toBe(true);
    }
  });

  it('put and get object with special characters and different types', async () => {
    await s3client.putObject(specialCharKey, specialCharContentString);
    const data = await s3client.getObject(specialCharKey);
    expect(data).toEqual(specialCharContentString);

    // list objects
    const objects = await s3client.listObjects();
    expect(objects).toBeInstanceOf(Array);
    expect(objects.length).toBe(1);
    expect(objects[0].Key).toBe(specialCharKey);
    expect(parseInt(objects[0].Size)).toBe(byteSize(specialCharContentString));

    // update the object with a buffer with extra content
    // This is to test if the object can be updated with a buffer that has extra content
    await s3client.putObject(specialCharKey, specialCharContentBufferExtra);
    const updatedData = await s3client.getObjectArrayBuffer(specialCharKey);
    const bufferData = Buffer.from(updatedData);
    expect(bufferData.toString('utf-8')).toBe(specialCharContentBufferExtra.toString('utf-8'));
    expect(bufferData.length).toBe(specialCharContentBufferExtra.length);

    const getObjectLength = await s3client.getContentLength(specialCharKey);
    expect(getObjectLength).toBe(specialCharContentBufferExtra.length);

    // Put object image/png
    await s3client.putObject(specialCharKey + '.png', specialCharContentBufferExtra, 'image/png');
    // get object with image/png content type
    const imageData = await s3client.getObjectResponse(specialCharKey + '.png');
    expect(imageData).toBeDefined();
    expect(imageData.headers.get('content-type')).toBe('image/png');

    // Clean up
    const delResp = await s3client.deleteObject(specialCharKey);
    expect(delResp).toBe(true);

    // Check if the object is deleted
    const deletedData = await s3client.getObject(specialCharKey);
    expect(deletedData).toBe(null);
  });

  // test If-Match header
  it('etag and if-match header check', async () => {
    const response = await s3client.putObject(key, contentString);
    const etag = sanitizeETag(response.headers.get('etag'));
    expect(etag).toBeDefined();
    expect(etag.length).toBe(32);

    const secondEtag = await s3client.getEtag(key);
    expect(secondEtag).toBe(etag);
    expect(secondEtag.length).toBe(32);

    const values = await s3client.getObjectWithETag(key);
    expect(values).toBeInstanceOf(Object);
    // convert arrayBuffer to string
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(values.data);
    expect(content).toBe(contentString);
    expect(values.etag).toBe(etag);
    expect(values.etag.length).toBe(32);

    const data = await s3client.getObject(key, { 'if-match': etag });
    expect(data).toBe(contentString);

    const randomWrongEtag = 'random-wrong-etag';
    const anotherResponse = await s3client.getObject(key, { 'if-match': randomWrongEtag });
    expect(anotherResponse).toBe(null);

    const reponse2 = await s3client.getObject(key, { 'if-none-match': etag });
    expect(reponse2).toBe(null);

    const reponse3 = await s3client.getObject(key, { 'if-none-match': randomWrongEtag });
    expect(reponse3).toBe(contentString);

    // Clean up
    const delResp = await s3client.deleteObject(key);
    expect(delResp).toBe(true);

    // Check if the object is deleted
    const deletedData = await s3client.getObject(key);
    expect(deletedData).toBe(null);
  });

  // list multipart uploads and abort them
  it('list multipart uploads and abort them all', async () => {
    let multipartUpload;
    do {
      multipartUpload = await s3client.listMultipartUploads();
      expect(multipartUpload).toBeDefined();
      expect(typeof multipartUpload).toBe('object');
      if (!multipartUpload.uploadId || !multipartUpload.Key) {
        break;
      }
      const abortUploadResponse = await s3client.abortMultipartUpload(multipartUpload.Key, multipartUpload.uploadId);
      expect(abortUploadResponse).toBeDefined();
      expect(abortUploadResponse.status).toBe('Aborted');
      expect(abortUploadResponse.Key).toEqual(multipartUpload.Key);
      expect(abortUploadResponse.uploadId).toEqual(multipartUpload.uploadId);
    } while (multipartUpload.uploadId && multipartUpload.Key);

    const multipartUpload2 = await s3client.listMultipartUploads();
    expect(multipartUpload2).toBeDefined();
    expect(typeof multipartUpload2).toBe('object');
    expect(multipartUpload2).not.toHaveProperty('key');
    expect(multipartUpload2).not.toHaveProperty('uploadId');
  });

  // multipart upload and download
  it('multipart upload and download', async () => {
    const multipartKey = 'multipart-object.txt';
    const partSize = EIGHT_MB; // 8 MB
    const totalParts = Math.ceil(large_buffer.length / partSize);
    const uploadId = await s3client.getMultipartUploadId(multipartKey);

    const uploadPromises = [];
    for (let i = 0; i < totalParts; i++) {
      const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize);
      uploadPromises.push(s3client.uploadPart(multipartKey, uploadId, partBuffer, i + 1));
    }
    const uploadResponses = await Promise.all(uploadPromises);

    const parts = uploadResponses.map((response, index) => ({
      partNumber: index + 1,
      etag: response.etag,
    }));

    const completeResponse = await s3client.completeMultipartUpload(multipartKey, uploadId, parts);
    expect(completeResponse).toBeDefined();
    expect(typeof completeResponse).toBe('object');
    const etag = completeResponse.etag;
    expect(etag).toBeDefined();
    expect(typeof etag).toBe('string');
    if (etag.length !== 34) {
      console.warn(`Warning: ETag length is unexpected: ${etag.length} (ETag: ${etag})`);
    }
    expect(etag.length).toBe(32 + 2); // 32 chars + 2 number of parts flag

    const dataArrayBuffer = await s3client.getObjectArrayBuffer(multipartKey);
    const dataBuffer = Buffer.from(dataArrayBuffer);
    expect(dataBuffer).toBeInstanceOf(Buffer);
    expect(dataBuffer.toString('utf-8')).toBe(large_buffer.toString('utf-8'));

    const multipartUpload = await s3client.listMultipartUploads();
    expect(multipartUpload).toBeDefined();
    expect(typeof multipartUpload).toBe('object');
    expect(multipartUpload).not.toHaveProperty('key');
    expect(multipartUpload).not.toHaveProperty('uploadId');

    if (providerName === 'cloudflare') {
      // Cloudflare SSE-C multipart upload
      const ssecHeaders = {
        'x-amz-server-side-encryption-customer-algorithm': 'AES256',
        'x-amz-server-side-encryption-customer-key': 'n1TKiTaVHlYLMX9n0zHXyooMr026vOiTEFfT+719Hho=',
        'x-amz-server-side-encryption-customer-key-md5': 'gepZmzgR7Be/1+K1Aw+6ow==',
      };
      const multipartKeySsec = 'multipart-object-ssec.txt';
      const uploadIdSsec = await s3client.getMultipartUploadId(multipartKeySsec, 'text/plain', ssecHeaders);
      const uploadPromises = [];
      for (let i = 0; i < totalParts; i++) {
        const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize);
        uploadPromises.push(
          s3client.uploadPart(multipartKeySsec, uploadIdSsec, partBuffer, i + 1, undefined, ssecHeaders),
        );
      }
      const uploadResponses = await Promise.all(uploadPromises);

      const parts = uploadResponses.map((response, index) => ({
        partNumber: index + 1,
        etag: response.etag,
      }));

      const completeResponse = await s3client.completeMultipartUpload(multipartKeySsec, uploadIdSsec, parts);
      expect(completeResponse).toBeDefined();
      expect(typeof completeResponse).toBe('object');
      const etagSsec = completeResponse.etag;
      expect(etagSsec).toBeDefined();
      expect(typeof etagSsec).toBe('string');
    }

    // lets test getObjectRaw with range
    const rangeStart = 2048 * 1024; // 2 MB
    const rangeEnd = 8 * 1024 * 1024 * 2; // 16 MB
    const rangeResponse = await s3client.getObjectRaw(multipartKey, false, rangeStart, rangeEnd);
    const rangeData = await rangeResponse.arrayBuffer();
    expect(rangeResponse).toBeDefined();

    expect(rangeData).toBeInstanceOf(ArrayBuffer);
    const rangeBuffer = Buffer.from(rangeData);
    expect(rangeBuffer.toString('utf-8')).toBe(large_buffer.subarray(rangeStart, rangeEnd).toString('utf-8'));

    const objectExists = await s3client.objectExists(multipartKey);
    expect(objectExists).toBe(true);
    const objectSize = await s3client.getContentLength(multipartKey);
    expect(objectSize).toBe(large_buffer.length);
    const objectEtag = await s3client.getEtag(multipartKey);
    expect(objectEtag).toBe(etag);
    expect(objectEtag.length).toBe(32 + 2); // 32 chars + 2 number of parts flag

    // test getEtag with opts mis/match
    const etagMatch = await s3client.getEtag(multipartKey, { 'if-match': etag });
    expect(etagMatch).toBe(etag);

    const etagMismatch = await s3client.getEtag(multipartKey, { 'if-match': 'wrong-etag' });
    expect(etagMismatch).toBe(null);

    const delResp = await s3client.deleteObject(multipartKey);
    expect(delResp).toBe(true);

    const objectExists2 = await s3client.objectExists(multipartKey);
    expect(objectExists2).toBe(false);

    const deletedData = await s3client.getObject(multipartKey);
    expect(deletedData).toBe(null);
  });

  // Add these tests within the testRunner function, after the existing tests

  it('copy object within same bucket', async () => {
    const sourceKey = 'copy-source.txt';
    const destKey = 'copy-destination.txt';
    const content = 'Content to be copied';

    // Setup: create source object
    await s3client.putObject(sourceKey, content, 'text/plain');

    // Basic copy
    const copyResult = await s3client.copyObject(sourceKey, destKey);
    expect(copyResult).toBeDefined();
    expect(copyResult.etag).toBeDefined();
    expect(copyResult.etag.length).toBeGreaterThanOrEqual(32);

    // Verify both objects exist
    const sourceData = await s3client.getObject(sourceKey);
    const destData = await s3client.getObject(destKey);
    expect(sourceData).toBe(content);
    expect(destData).toBe(content);

    // Copy with metadata replacement
    const destKey2 = 'copy-with-metadata.txt';
    const copyResult2 = await s3client.copyObject(sourceKey, destKey2, {
      metadataDirective: 'REPLACE',
      metadata: {
        'custom-key': 'custom-value',
        'another-key': 'another-value',
      },
      contentType: 'text/markdown',
    });
    expect(copyResult2).toBeDefined();
    expect(copyResult2.etag).toBeDefined();

    // Verify the new object exists
    const destData2 = await s3client.getObjectResponse(destKey2);
    expect(destData2).toBeDefined();
    expect(destData2.headers.get('content-type')).toBe('text/markdown');
    const destContent2 = await destData2.text();
    expect(destContent2).toBe(content);

    // Copy with special characters
    const specialSourceKey = 'special source key with spaces & chars!.txt';
    const specialDestKey = 'special dest key with spaces & chars!.txt';
    await s3client.putObject(specialSourceKey, content);

    const copyResult3 = await s3client.copyObject(specialSourceKey, specialDestKey);
    expect(copyResult3).toBeDefined();
    expect(copyResult3.etag).toBeDefined();

    const specialData = await s3client.getObject(specialDestKey);
    expect(specialData).toBe(content);

    // Cleanup
    await s3client.deleteObjects([sourceKey, destKey, destKey2, specialSourceKey, specialDestKey]);

    // Verify cleanup
    expect(await s3client.objectExists(sourceKey)).toBe(false);
    expect(await s3client.objectExists(destKey)).toBe(false);
    expect(await s3client.objectExists(destKey2)).toBe(false);
  });

  it('move object within same bucket', async () => {
    const sourceKey = 'move-source.txt';
    const destKey = 'move-destination.txt';
    const content = 'Content to be moved';

    // Setup: create source object
    const putResult = await s3client.putObject(sourceKey, content, 'text/plain');
    const originalEtag = sanitizeETag(putResult.headers.get('etag'));
    expect(originalEtag).toBeDefined();

    // Verify source exists
    expect(await s3client.objectExists(sourceKey)).toBe(true);

    // Move the object
    const moveResult = await s3client.moveObject(sourceKey, destKey);
    expect(moveResult).toBeDefined();
    expect(moveResult.etag).toBeDefined();

    // Verify source no longer exists
    expect(await s3client.objectExists(sourceKey)).toBe(false);
    const sourceData = await s3client.getObject(sourceKey);
    expect(sourceData).toBe(null);

    // Verify destination exists with same content
    expect(await s3client.objectExists(destKey)).toBe(true);
    const destData = await s3client.getObject(destKey);
    expect(destData).toBe(content);

    // Move with metadata replacement
    const destKey2 = 'move-with-metadata.txt';
    await s3client.putObject('temp-source.txt', content);

    const moveResult2 = await s3client.moveObject('temp-source.txt', destKey2, {
      metadataDirective: 'REPLACE',
      metadata: {
        moved: 'true',
        timestamp: new Date().toISOString(),
      },
      contentType: 'application/json',
    });
    expect(moveResult2).toBeDefined();
    expect(moveResult2.etag).toBeDefined();

    // Verify source deleted and destination exists
    expect(await s3client.objectExists('temp-source.txt')).toBe(false);
    const destResponse2 = await s3client.getObjectResponse(destKey2);
    expect(destResponse2).toBeDefined();
    expect(destResponse2.headers.get('content-type')).toBe('application/json');

    // Move with special characters
    const specialSourceKey = 'special move source & chars!.txt';
    const specialDestKey = 'special move dest & chars!.txt';
    await s3client.putObject(specialSourceKey, content);

    const moveResult3 = await s3client.moveObject(specialSourceKey, specialDestKey);
    expect(moveResult3).toBeDefined();

    expect(await s3client.objectExists(specialSourceKey)).toBe(false);
    expect(await s3client.objectExists(specialDestKey)).toBe(true);

    // Cleanup
    await s3client.deleteObjects([destKey, destKey2, specialDestKey]);

    // Verify cleanup
    expect(await s3client.objectExists(destKey)).toBe(false);
    expect(await s3client.objectExists(destKey2)).toBe(false);
    expect(await s3client.objectExists(specialDestKey)).toBe(false);
  });

  it('copy and move large multipart object', async () => {
    const sourceKey = 'large-copy-source.bin';
    const copyDestKey = 'large-copy-dest.bin';
    const moveDestKey = 'large-move-dest.bin';

    // Create a large object using multipart upload
    const partSize = EIGHT_MB;
    const totalParts = Math.ceil(large_buffer.length / partSize);
    const uploadId = await s3client.getMultipartUploadId(sourceKey);

    const uploadPromises = [];
    for (let i = 0; i < totalParts; i++) {
      const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize);
      uploadPromises.push(s3client.uploadPart(sourceKey, uploadId, partBuffer, i + 1));
    }

    const uploadResponses = await Promise.all(uploadPromises);
    const parts = uploadResponses.map((response, index) => ({
      partNumber: index + 1,
      etag: response.etag,
    }));

    const completeResponse = await s3client.completeMultipartUpload(sourceKey, uploadId, parts);
    expect(completeResponse.etag).toBeDefined();

    // Copy the large object
    const copyResult = await s3client.copyObject(sourceKey, copyDestKey);
    expect(copyResult).toBeDefined();
    expect(copyResult.etag).toBeDefined();

    // Verify both exist and have same size
    const sourceLength = await s3client.getContentLength(sourceKey);
    const copyLength = await s3client.getContentLength(copyDestKey);
    expect(copyLength).toBe(sourceLength);
    expect(copyLength).toBe(large_buffer.length);

    // Move the copy to another location
    const moveResult = await s3client.moveObject(copyDestKey, moveDestKey);
    expect(moveResult).toBeDefined();

    // Verify move worked
    expect(await s3client.objectExists(copyDestKey)).toBe(false);
    expect(await s3client.objectExists(moveDestKey)).toBe(true);

    const moveLength = await s3client.getContentLength(moveDestKey);
    expect(moveLength).toBe(large_buffer.length);

    // Cleanup
    await s3client.deleteObjects([sourceKey, moveDestKey]);
    expect(await s3client.objectExists(sourceKey)).toBe(false);
    expect(await s3client.objectExists(moveDestKey)).toBe(false);
  });

  // Add Cloudflare-specific SSE-C tests if needed
  if (providerName === 'cloudflare') {
    it('copy and move with SSE-C encryption', async () => {
      const ssecHeaders = {
        'x-amz-server-side-encryption-customer-algorithm': 'AES256',
        'x-amz-server-side-encryption-customer-key': 'n1TKiTaVHlYLMX9n0zHXyooMr026vOiTEFfT+719Hho=',
        'x-amz-server-side-encryption-customer-key-md5': 'gepZmzgR7Be/1+K1Aw+6ow==',
      };

      const sourceKey = 'ssec-copy-source.txt';
      const destKey = 'ssec-copy-dest.txt';
      const content = 'Encrypted content';

      // Create encrypted source
      await s3client.putObject(sourceKey, content, 'text/plain', ssecHeaders);

      // Copy with SSE-C (both source and destination encrypted)
      const copyResult = await s3client.copyObject(sourceKey, destKey, {
        sourceSSECHeaders: {
          'x-amz-copy-source-server-side-encryption-customer-algorithm': 'AES256',
          'x-amz-copy-source-server-side-encryption-customer-key': 'n1TKiTaVHlYLMX9n0zHXyooMr026vOiTEFfT+719Hho=',
          'x-amz-copy-source-server-side-encryption-customer-key-md5': 'gepZmzgR7Be/1+K1Aw+6ow==',
        },
        destinationSSECHeaders: ssecHeaders,
      });

      expect(copyResult).toBeDefined();
      expect(copyResult.etag).toBeDefined();

      // Verify destination is encrypted and has correct content
      const destData = await s3client.getObject(destKey, {}, ssecHeaders);
      expect(destData).toBe(content);

      // Try to read without encryption headers (should fail)
      try {
        await s3client.getObject(destKey);
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).toContain('400');
      }

      // Cleanup
      await s3client.deleteObjects([sourceKey, destKey]);
    });
  }

  it('extensive list objects', async () => {
    const prefix = `test-prefix-${Date.now()}/`;
    const objAll = await s3client.listObjects('/', prefix);
    expect(objAll).toEqual([]);
    expect(objAll).toBeInstanceOf(Array);
    expect(objAll).toHaveLength(0);

    await Promise.all([
      s3client.putObject(`${prefix}object1.txt`, contentString),
      s3client.putObject(`${prefix}object2.txt`, contentString),
      s3client.putObject(`${prefix}object3.txt`, contentString),
    ]);

    const objsUnlimited = await s3client.listObjects('/', prefix);
    expect(objsUnlimited).toBeInstanceOf(Array);
    expect(objsUnlimited).toHaveLength(3);

    const objsLimited = await s3client.listObjects('/', prefix, 2);
    expect(objsLimited).toBeInstanceOf(Array);
    expect(objsLimited).toHaveLength(2);
    expect(objsLimited[0].Key).toBe(`${prefix}object1.txt`);
    expect(objsLimited[1].Key).toBe(`${prefix}object2.txt`);

    // await Promise.all(objsUnlimited.map(o => s3client.deleteObject(o.key)));
    await s3client.deleteObjects(objsUnlimited.map(o => o.Key));
    expect(await s3client.listObjects('/', prefix)).toEqual([]);
  });

  it('lists objects with pagination', async () => {
    /* ----- test data setup ----- */
    const prefix = `test-prefix-${Date.now()}/`; // isolate this run
    const totalKeys = 1_114;
    const pageSmall = 2;
    const pageLarge = 900;
    let counter = 0;
    let attempts = 0;
    let errors = [];

    // Bucket must start empty for this prefix
    expect(await s3client.listObjects('/', prefix)).toEqual([]);
    // Upload 1 114 objects in parallel
    const generator = function* (n) {
      for (let i = 0; i < n; i++)
        yield async () => {
          try {
            const response = await s3client.putObject(`${prefix}object${i}.txt`, contentString);
            attempts++;
            if (response.status === 200) {
              counter++;
            } else {
              throw new Error(`Unexpected status ${response.status}`);
            }
          } catch (err) {
            errors.push({ index: i, error: err.message || err });
            throw err; // Re-throw to let runInBatches handle it
          }
        };
    };
    if (providerName === 'backblaze') {
      // Backblaze-specific: retry failed uploads
      await runInBatches(generator(totalKeys), 20, 1_000);

      // Check what's missing and retry
      const uploaded = await s3client.listObjects('/', prefix);
      const missingCount = totalKeys - uploaded.length;

      if (missingCount > 0) {
        const uploadedKeys = new Set(uploaded.map(o => o.Key));
        for (let i = 0; i < totalKeys; i++) {
          const key = `${prefix}object${i}.txt`;
          if (!uploadedKeys.has(key)) {
            await s3client.putObject(key, contentString);
            counter++;
          }
        }
      }
    } else {
      await runInBatches(generator(totalKeys), OP_CAP, 1_000);
    }
    /* ----- assertions ----- */
    // 1️⃣  Small page (2)
    const firstTwo = await s3client.listObjects('/', prefix, pageSmall);
    expect(firstTwo).toBeInstanceOf(Array);
    expect(firstTwo).toHaveLength(pageSmall); // ✔ array length = 2:contentReference[oaicite:1]{index=1}

    // 2️⃣  “Maximum” single page (1 000)
    const first900Hundred = await s3client.listObjects('/', prefix, pageLarge);
    expect(first900Hundred).toBeInstanceOf(Array);
    expect(first900Hundred).toHaveLength(pageLarge); // ✔ array length = 900:contentReference[oaicite:2]{index=2}
    expect(first900Hundred[0].Key).toBe(`${prefix}object0.txt`); // ✔ first object key
    await new Promise(resolve => setTimeout(resolve, 2000));
    // 3️⃣  Unlimited (implicit pagination inside helper)
    let everything = await s3client.listObjects('/', prefix); // maxKeys = undefined ⇒ list all
    expect(everything).toBeInstanceOf(Array);
    expect(everything).toHaveLength(counter);

    // cleanup and test deleteObjects
    for (let i = 0; i < 3; i++) {
      everything = await s3client.listObjects('/', prefix);
      if (everything.length === totalKeys) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    expect(everything.length).toBe(totalKeys);
    const massDelete = await s3client.deleteObjects(everything.map(o => o.Key));

    // Check if all deletions were successful
    const allDeleted = massDelete.every(result => result === true);
    expect(massDelete).toBeInstanceOf(Array);
    expect(massDelete.length).toBe(everything.length);
    expect(allDeleted).toBe(true);

    // Verify bucket now empty for this prefix
    expect(await s3client.listObjects('/', prefix)).toEqual([]);
  });
};
