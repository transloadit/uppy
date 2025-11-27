# s3mini | Tiny & fast S3 client for node and edge platforms.

`s3mini` is an ultra-lightweight Typescript client (~14 KB minified, ≈15 % more ops/s) for S3-compatible object storage. It runs on Node, Bun, Cloudflare Workers, and other edge platforms. It has been tested on Cloudflare R2, Backblaze B2, DigitalOcean Spaces, Ceph, Oracle, Garage and MinIO. (No Browser support!)

[[github](https://github.com/good-lly/s3mini)]
[[issues](https://github.com/good-lly/s3mini/issues)]
[[npm](https://www.npmjs.com/package/s3mini)]

## Features

- 🚀 Light and fast: averages ≈15 % more ops/s and only ~18 KB (minified, not gzipped).
- 🔧 Zero dependencies; supports AWS SigV4 (no pre-signed requests) and SSE-C headers (tested only on Cloudflare)
- 🟠 Works on Cloudflare Workers; ideal for edge computing, Node, and Bun (no browser support).
- 🔑 Only the essential S3 APIs—improved list, put, get, delete, and a few more.
- 🛠️ Supports multipart uploads.
- 🎯 TypeScript support with type definitions.
- 📚 Poorly-documented with examples and tests - But widely tested on various S3-compatible services! (Contributions welcome!)
- 📦 **BYOS3** — _Bring your own S3-compatible bucket_ (tested on Cloudflare R2, Backblaze B2, DigitalOcean Spaces, MinIO, Garage, Micro/Ceph and Oracle Object Storage, Scaleway).

#### Tested On

![Tested On](testedon.png)
Contributions welcome!

Dev:

[![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/m/good-lly/s3mini/dev?color=green)](https://github.com/good-lly/s3mini/commits/dev)
[![GitHub Issues or Pull Requests](https://img.shields.io/github/issues/good-lly/s3mini)](https://github.com/good-lly/s3mini/issues)
[![CodeQL Advanced](https://github.com/good-lly/s3mini/actions/workflows/codeql.yml/badge.svg?branch=dev)](https://github.com/good-lly/s3mini/actions/workflows/codeql.yml)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=bugs)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=good-lly_s3mini&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=good-lly_s3mini)
[![Test:e2e(all)](https://github.com/good-lly/s3mini/actions/workflows/test-e2e.yml/badge.svg?branch=dev)](https://github.com/good-lly/s3mini/actions/workflows/test-e2e.yml)

![GitHub Repo stars](https://img.shields.io/github/stars/good-lly/s3mini?style=social)
[![NPM Downloads](https://img.shields.io/npm/dm/s3mini)](https://www.npmjs.com/package/s3mini)
![NPM Version](https://img.shields.io/npm/v/s3mini?color=green)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/s3mini?color=green)
![GitHub License](https://img.shields.io/github/license/good-lly/s3mini)

<a href="https://github.com/good-lly/s3mini/issues/"> <img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg" alt="Contributions welcome" /></a>

Performance tests was done on local Minio instance. Your results may vary depending on environment and network conditions, so take it with a grain of salt.
![performance-image](https://raw.githubusercontent.com/good-lly/s3mini/dev/performance-screenshot.png)

## Table of Contents

- [Supported Ops](#supported-ops)
- [Installation](#installation)
- [Usage](#usage)
- [Security Notes](#security-notes)
- [💙 Contributions welcomed!](#contributions-welcomed)
- [License](#license)

## Supported Ops

The library supports a subset of S3 operations, focusing on essential features, making it suitable for environments with limited resources.

#### Bucket ops

- ✅ HeadBucket (bucketExists)
- ✅ createBucket (createBucket)

#### Objects ops

- ✅ ListObjectsV2 (listObjects)
- ✅ GetObject (getObject, getObjectResponse, getObjectWithETag, getObjectRaw, getObjectArrayBuffer, getObjectJSON)
- ✅ PutObject (putObject)
- ✅ DeleteObject (deleteObject)
- ✅ DeleteObjects (deleteObjects)
- ✅ HeadObject (objectExists, getEtag, getContentLength)
- ✅ listMultipartUploads
- ✅ CreateMultipartUpload (getMultipartUploadId)
- ✅ completeMultipartUpload
- ✅ abortMultipartUpload
- ✅ uploadPart
- ✅ CopyObject: Local copyObject/moveObject(copyObject w delete)

Put/Get objects with SSE-C (server-side encryption with customer-provided keys) is supported, but only tested on Cloudflare R2!

## Installation

```bash
npm install s3mini
```

```bash
yarn add s3mini
```

```bash
pnpm add s3mini
```

### Environment Variables

To use `s3mini`, you need to set up your environment variables for provider credentials and S3 endpoint. Create a `.env` file in your project root directory. Checkout the [example.env](example.env) file for reference.

```bash
# On Windows, Mac, or Linux
mv example.env .env
```

> **⚠️ Environment Support Notice**
>
> This library is designed to run in environments like **Node.js**, **Bun**, and **Cloudflare Workers**. It does **not support browser environments** due to the use of Node.js APIs and polyfills.
>
> **Cloudflare Workers:** Now works without `nodejs_compat` compatibility flag, using native WebCrypto!

## Usage

> [!WARNING]
> `s3mini` was a deprecated alias removed in a recent `0.5.0` release. Please migrate to the new `S3mini` class.

```typescript
import { S3mini, sanitizeETag } from 's3mini';

const s3client = new S3mini({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  endpoint: config.endpoint, // e.g., 'https://<your-bucket>.<your-region>.digitaloceanspaces.com'
  region: config.region,
  // ?requestSizeInBytes = default is 8 MB
  // ?requestAbortTimeout = default is no timeout
  // ?logger = default is undefined (no logging)
  // ?fetch = default is globalThis.fetch (you can provide your own fetch implementation)
});

// Basic bucket ops
let exists: boolean = false;
try {
  // Check if the bucket exists
  exists = await s3client.bucketExists();
} catch (err) {
  throw new Error(`Failed bucketExists() call, wrong credentials maybe: ${err.message}`);
}
if (!exists) {
  // Create the bucket based on the endpoint bucket name
  await s3client.createBucket();
}

// Basic object ops
// key is the name of the object in the bucket
const smallObjectKey: string = 'small-object.txt';
// content is the data you want to store in the object
// it can be a string or Buffer (recommended for large objects)
const smallObjectContent: string = 'Hello, world!';

// check if the object exists
const objectExists: boolean = await s3client.objectExists(smallObjectKey);
let etag: string | null = null;
if (!objectExists) {
  // put/upload the object, content can be a string or Buffer
  // to add object into "folder", use "folder/filename.txt" as key
  // Third argument is optional, it can be used to set content type ... default is 'application/octet-stream'
  const resp: Response = await s3client.putObject(smallObjectKey, smallObjectContent);
  // example with content type:
  // const resp: Response = await s3client.putObject(smallObjectKey, smallObjectContent, 'image/png');
  // you can also get etag via getEtag method
  // const etag: string = await s3client.getEtag(smallObjectKey);
  etag = sanitizeETag(resp.headers.get('etag'));
}

// get the object, null if not found
const objectData: string | null = await s3client.getObject(smallObjectKey);
console.log('Object data:', objectData);

// get the object with ETag, null if not found
const response2: Response = await S3mini.getObject(smallObjectKey, { 'if-none-match': etag });
if (response2) {
  // ETag changed so we can get the object data and new ETag
  // Note: ETag is not guaranteed to be the same as the MD5 hash of the object
  // ETag is sanitized to remove quotes
  const etag2: string = sanitizeETag(response2.headers.get('etag'));
  console.log('Object data with ETag:', response2.body, 'ETag:', etag2);
} else {
  console.log('Object not found or ETag does match.');
}

// list objects in the bucket, null if bucket is empty
// Note: listObjects uses listObjectsV2 API and iterate over all pages
// so it will return all objects in the bucket which can take a while
// If you want to limit the number of objects returned, use the maxKeys option
// If you want to list objects in a specific "folder", use "folder/" as prefix
// Example s3client.listObjects({"/" "myfolder/"})
const list: object[] | null = await s3client.listObjects();
if (list) {
  console.log('List of objects:', list);
} else {
  console.log('No objects found in the bucket.');
}

// delete the object
const wasDeleted: boolean = await s3client.deleteObject(smallObjectKey);
// to delete multiple objects, use deleteObjects method
// const keysToDelete: string[] = ['object1.txt', 'object2.txt'];
// const deletedArray: boolean[] = await s3client.deleteObjects(keysToDelete);
// Note: deleteObjects returns an array of booleans, one for each key, indicating if the object was deleted or not

// Multipart upload
const multipartKey = 'multipart-object.txt';
const large_buffer = new Uint8Array(1024 * 1024 * 15); // 15 MB buffer
const partSize = 8 * 1024 * 1024; // 8 MB
const totalParts = Math.ceil(large_buffer.length / partSize);
// Beware! This will return always a new uploadId
// if you want to use the same uploadId, you need to store it somewhere
const uploadId = await s3client.getMultipartUploadId(multipartKey);
const uploadPromises = [];
for (let i = 0; i < totalParts; i++) {
  const partBuffer = large_buffer.subarray(i * partSize, (i + 1) * partSize);
  // upload each part
  // Note: uploadPart returns a promise, so you can use Promise.all to upload all parts in parallel
  // but be careful with the number of parallel uploads, it can cause throttling
  // or errors if you upload too many parts at once
  // You can also use generator functions to upload parts in batches
  uploadPromises.push(s3client.uploadPart(multipartKey, uploadId, partBuffer, i + 1));
}
const uploadResponses = await Promise.all(uploadPromises);
const parts = uploadResponses.map((response, index) => ({
  partNumber: index + 1,
  etag: response.etag,
}));
// Complete the multipart upload
const completeResponse = await s3client.completeMultipartUpload(multipartKey, uploadId, parts);
const completeEtag = completeResponse.etag;

// List multipart uploads
// returns object with uploadId and key
const multipartUploads: object = await s3client.listMultipartUploads();
// Abort the multipart upload
const abortResponse = await s3client.abortMultipartUpload(multipartUploads.key, multipartUploads.uploadId);

// Multipart download
// lets test getObjectRaw with range
const rangeStart = 2048 * 1024; // 2 MB
const rangeEnd = 8 * 1024 * 1024 * 2; // 16 MB
const rangeResponse = await s3client.getObjectRaw(multipartKey, false, rangeStart, rangeEnd);
const rangeData = await rangeResponse.arrayBuffer();

// Local copyObject example
const result = await s3.copyObject('report-2024.pdf', 'archive/report-2024.pdf');
```

For more check [USAGE.md](USAGE.md) file, examples and tests.

## Security Notes

- The library masks sensitive information (access keys, session tokens, etc.) when logging.
- Always protect your AWS credentials and avoid hard-coding them in your application (!!!). Use environment variables. Use environment variables or a secure vault for storing credentials.
- Ensure you have the necessary permissions to access the S3 bucket and perform operations.
- Be cautious when using multipart uploads, as they can incur additional costs if not managed properly.
- Authors are not responsible for any data loss or security breaches resulting from improper usage of the library.
- If you find a security vulnerability, please report it to us directly via email. For more details, please refer to the [SECURITY.md](SECURITY.md) file.

## Contributions welcomed! (in specific order)

Contributions are greatly appreciated! If you have an idea for a new feature or have found a bug, we encourage you to get involved in this order:

1. _Open/Report Issues or Ideas_: If you encounter a problem, have an idea or a feature request, please open an issue on GitHub (FIRST!) . Be concise but include as much detail as necessary (environment, error messages, logs, steps to reproduce, etc.) so we can understand and address the issue and have a dialog.

2. _Create Pull Requests_: We welcome PRs! If you want to implement a new feature or fix a bug, feel free to submit a pull request to the latest `dev branch`. For major changes, it's a necessary to discuss your plans in an issue first!

3. _Lightweight Philosophy_: When contributing, keep in mind that s3mini aims to remain lightweight and dependency-free. Please avoid adding heavy dependencies. New features should provide significant value to justify any increase in size.

4. _Community Conduct_: Be respectful and constructive in communications. We want a welcoming environment for all contributors. For more details, please refer to our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). No one reads it, but it's there for a reason.

If you figure out a solution to your question or problem on your own, please consider posting the answer or closing the issue with an explanation. It could help the next person who runs into the same thing!

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Sponsor This Project

Developing and maintaining s3mini (and other open-source projects) requires time and effort. If you find this library useful, please consider sponsoring its development. Your support helps ensure I can continue improving s3mini and other projects. Thank you!

[![Become a Sponsor](https://img.shields.io/badge/💸_GitHub-Sponsor-ff69b4?logo=github&logoColor=white)](https://github.com/sponsors/good-lly)
