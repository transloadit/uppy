- [Bucket Operations](#bucket-operations)
  - [List Operations](#list-operations)
  - [Object Operations](#object-operations)
  - [Multipart Upload](#multipart-upload)
  - [Useful Helpers](#useful-helpers)
  - [Error Handling](#error-handling)
  - [Advanced Usage](#advanced-usage)

#### Constructor

> [!WARNING]
> `s3mini` is a deprecated alias retained solely for backward compatibility.
> It is scheduled for removal in a future release. Please migrate to the new `S3mini` class.

Create a new instance of the s3mini client:

```javascript
import { S3mini } from 's3mini';
// add S3Config types if needed for Typescript

const s3client = new S3mini({
  accessKeyId: 'YOUR_ACCESS_KEY_ID',
  secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  endpoint: 'https://s3.amazonaws.com/...', // S3 endpoint (use your region or custom domain) including bucket name
  region: 'us-east-1',// AWS region (use 'auto' for Cloudflare R2)
  maxRequestSizeInBytes?: 8388608, // Optional, defaults to 8MB
  requestAbortTimeout?: 30000, // Optional, timeout in milliseconds
  logger?: console, // Optional, custom logger
});
```

### Bucket Operations

#### Check if Bucket Exists

```javascript
const bucketExists = await s3client.bucketExists();
console.log(`Bucket exists: ${bucketExists}`);
```

#### Create Bucket

```javascript
const created = await s3client.createBucket();
console.log(`Bucket created: ${created}`);
```

### Object Operations

### List Operations

#### List Objects

```javascript
const delimiter = '/';
const prefix = 'folder/';
const maxKeys = 1000;

const objects = await s3client.listObjects(delimiter, prefix, maxKeys);
console.log(`Objects: ${JSON.stringify(objects)}`);
```

#### List Multipart Uploads

```javascript
const delimiter = '/';
const prefix = 'folder/';

const uploads = await s3client.listMultiPartUploads(delimiter, prefix);
console.log(`Multipart uploads: ${JSON.stringify(uploads)}`);
```

#### Upload a File

```javascript
const fileContent = 'Hello, World!';
const key = 'example.txt';
const response = await s3client.putObject(key, fileContent);
console.log(`File uploaded successfully: ${response.status === 200}`);
```

#### Get a File

```javascript
const key = 'example.txt';
const response = await s3client.getObject(key);
if (response) {
  const content = await response.text();
  console.log(`File content: ${content}`);
} else {
  console.log('File not found');
}
```

#### Get a File with ETag

```javascript
const key = 'example.txt';
const { etag, data } = await s3client.getObjectWithETag(key);
if (data) {
  console.log(`File content: ${data}`);
  console.log(`ETag: ${etag}`);
}
```

#### Check if File Exists

```javascript
const key = 'example.txt';
const exists = await s3client.objectExists(key);
console.log(`File exists: ${exists}`);
```

#### Get ETag of a File

```javascript
const key = 'example.txt';
const etag = await s3client.getEtag(key);
console.log(`File ETag: ${etag}`);
```

#### Get Content Length

```javascript
const key = 'example.txt';
const contentLength = await s3client.getContentLength(key);
console.log(`File size: ${contentLength} bytes`);
```

#### Get Raw Response

```javascript
const key = 'example.txt';
const response = await s3client.getObjectRaw(key);
// Process the raw response
```

#### Delete a File

```javascript
const key = 'example.txt';
const deleted = await s3client.deleteObject(key);
console.log(`File deleted: ${deleted}`);
```

### Multipart Upload

#### Initiate Multipart Upload

```javascript
const key = 'large-file.txt';
const fileType = 'text/plain';
const uploadId = await s3client.getMultipartUploadId(key, fileType);
console.log(`Multipart upload initiated with ID: ${uploadId}`);
```

#### Upload Part

```javascript
const key = 'large-file.txt';
const partContent = Buffer.from('Part content...');
const uploadId = 'your-upload-id';
const partNumber = 1;

const partResult = await s3client.uploadPart(key, partContent, uploadId, partNumber);
console.log(`Part uploaded: ${JSON.stringify(partResult)}`);
```

#### Complete Multipart Upload

```javascript
const key = 'large-file.txt';
const uploadId = 'your-upload-id';
const parts = [
  { partNumber: 1, ETag: 'etag1' },
  { partNumber: 2, ETag: 'etag2' },
];

const result = await s3client.completeMultipartUpload(key, uploadId, parts);
console.log(`Multipart upload completed: ${JSON.stringify(result)}`);
```

#### Abort Multipart Upload

```javascript
const key = 'large-file.txt';
const uploadId = 'your-upload-id';

const result = await s3client.abortMultipartUpload(key, uploadId);
console.log(`Multipart upload aborted: ${JSON.stringify(result)}`);
```

## Useful Helpers

#### Sanitize ETag

```javascript
import { sanitizeETag } from 's3mini';
...
const rawETag = '\"abcdef1234567890\"';
const sanitizedETag = s3client.sanitizeETag(rawETag);
console.log(`Sanitized ETag: ${sanitizedETag}`); // Outputs: abcdef1234567890
```

#### Ratelimiting and batching (runInBatches)

Some operations can be rate-limited. Use the `runInBatches` method to process items in batches within a specified time interval:

```javascript
import { runInBatches } from 's3mini';
const OP_CAP = 50; // Max operations per second
const INTERVAL = 1_000; // Interval in milliseconds
const generator = function* (n) {
  for (let i = 0; i < n; i++)
    yield async () => {
      await s3client.putObject(`${prefix}object${i}.txt`, 'hello world');
    };
};
// you can feed runInBatches with any async generator or array of promises/async functions
await runInBatches(generator(5000), OP_CAP, INTERVAL);
```

## Error Handling

The library throws descriptive error messages for invalid parameters and failed operations. Always use try-catch blocks when working with asynchronous operations:

```javascript
try {
  const result = await s3client.getObject('non-existent-file.txt');
  // Process result
} catch (error) {
  console.error(`Error: ${error.message}`);
}
```

## Advanced Usage

### Custom Headers and Options

Many methods accept optional parameters for customization:

```javascript
// Get with conditional headers
const result = await s3client.getObject('example.txt', {
  'if-match': 'etag-value',
  'if-modified-since': new Date().toUTCString(),
});
```

### Custom Logger Integration

The library supports custom loggers for better integration with your application's logging system:

```javascript
const customLogger = {
  info: message => {
    /* Custom info logging */
  },
  error: message => {
    /* Custom error logging */
  },
  warn: message => {
    /* Custom warning logging */
  },
};

const s3client = new S3mini({
  // Other parameters
  logger?: customLogger,
});
```
