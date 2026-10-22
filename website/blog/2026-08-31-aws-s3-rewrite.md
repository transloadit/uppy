---
title: 'Rewriting @uppy/aws-s3 from scratch'
date: 2026-08-31T09:00
authors: [prakash, mifi, remcohaszing]
slug: 'aws-s3-rewrite'
published: true
toc_max_heading_level: 2
---

`@uppy/aws-s3` has been Uppy’s most-used uploader plugin, but also the one with
the most bug reports. Over the years, it accumulated nearly 2,000 lines of
tightly coupled code, 11 user-facing callback options, and 8 Companion
endpoints. Every bug fix risked breaking something else and nobody wanted to
touch it.

So we rewrote it.

The new plugin closes
[**14 open issues**](https://github.com/transloadit/uppy/issues/6229) and
replaces 11 overlapping callbacks (which conflated signing with S3 protocol
details) with 3 mutually exclusive signing modes, plus a few orthogonal config
options. Companion is now optional: you can talk directly to any S3-compatible
service from the browser.

<!--truncate-->

## Why a rewrite?

The old plugin was the product of years of incremental additions. What started
as a multipart uploader grew to handle single-part PUT uploads, presigned POST
uploads, client-side SigV4 signing, Companion-backed signing, and more. All of
it lived in one class with shared state and interleaved code paths. The
[original proposal](https://github.com/transloadit/uppy/issues/6055) sums it up:
the plugin had become completely unwieldy, accumulating the highest number of
[reported problems](https://github.com/transloadit/uppy/issues?q=is%3Aissue%20state%3Aopen%20aws%20s3).

The new architecture splits things into two layers:

- **S3mini**: a standalone, browser-native S3 client that doesn’t depend on
  Uppy’s plugin system (the only Uppy code it uses is the internal `fetcher`
  helper for XHR with retries). It handles presigned URLs, SigV4 signing,
  multipart orchestration, XML parsing, retries with exponential backoff,
  offline detection, and credential caching. It uses the
  [Web Crypto API](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API)
  and `XMLHttpRequest`. (`XMLHttpRequest` is used instead of `fetch`, because
  the Fetch API does not expose upload progress events; XHR’s
  `xhr.upload.onprogress` is the only standard way to stream byte-count updates
  into Uppy’s progress system.) No AWS SDK is needed.
- **The plugin**: a thin wrapper that wires S3mini to Uppy’s file lifecycle
  (progress events, pause/resume, abort, Golden Retriever state).

Both sit on top of an `S3Client` abstract base, with `S3mini` and `CompanionS3`
as the two concrete implementations. The orchestration code above doesn’t care
which one is in use, so progress, retries, pause/resume, and resume-from-refresh
all behave identically across signing modes.

Each layer has one job. S3 protocol concerns stay in the client, Uppy concerns
stay in the plugin.

The S3mini client is forked from
[good-lly/s3mini](https://github.com/good-lly/s3mini) (MIT-licensed, by Jølly
Good), simplified and streamlined for browser use and integrated with Uppy’s
upload lifecycle. Using a small, battle-tested S3 client as a starting point,
instead of reinventing SigV4, was the single biggest reason this rewrite was
tractable.

## 3 signing modes

The old plugin exposed 11 callback options and it was never clear which
combination to provide. The new plugin replaces all of that with **3 mutually
exclusive signing modes**:

### `getCredentials` : client-side signing

Your backend returns temporary STS credentials. The plugin signs all requests in
the browser using SigV4. No server round-trip per request.

```js
new Uppy().use(AwsS3, {
	s3Endpoint: 'https://my-bucket.s3.us-east-1.amazonaws.com',
	getCredentials: async () => {
		const res = await fetch('/api/s3/credentials');
		return res.json();
		// {
		//   credentials: { accessKeyId, secretAccessKey, sessionToken },
		//   region: 'us-east-1',
		// }
	},
});
```

The `region` used for signing comes from the `getCredentials` response. You can
also pass it as a plugin option. If neither is set, it falls back to `auto`.
This is fine for region-less services like Cloudflare R2, but for AWS you need
to supply the real region one way or the other.

### `signRequest` : bring your own signer

Your backend signs each request and returns a presigned URL. No other options
needed; the presigned URL determines where the bytes go. If your backend chooses
a different key, it returns it as `key`, and Uppy uses that key for the rest of
the upload.

```js
new Uppy().use(AwsS3, {
	signRequest: async ({ method, key, uploadId, partNumber }) => {
		const res = await fetch('/api/s3/sign', {
			method: 'POST',
			body: JSON.stringify({ method, key, uploadId, partNumber }),
		});
		return res.json(); // { url: 'https://presigned-url.example' }, key is optional
	},
});
```

### `companionEndpoint` : Companion signing

Point the plugin at your Companion server. Nothing else to configure.

```js
new Uppy().use(AwsS3, {
	companionEndpoint: 'https://companion.example',
});
```

Options like `shouldUseMultipart`, `getChunkSize`, `limit`, `generateObjectKey`,
and `allowedMetaFields` are still available as simple configurations. They
simply no longer function as callbacks that replace S3 operations.

## Companion is now optional

The old plugin essentially required a Companion server (or a custom callback for
every S3 operation) to do anything. The new plugin lets you talk directly to any
S3-compatible service from the browser using `signRequest` or `getCredentials`.
Companion is removed entirely from the data path.

Existing Companion deployments still work unchanged. The `companionEndpoint`
mode reuses the same Companion endpoints the old plugin used, so server-side key
generation (`config.getKey()`), STS credential issuance, and presigning all keep
behaving the same. The only migration step on the client is renaming `endpoint`
→ `companionEndpoint`.

## Use any S3-compatible service

The new `s3Endpoint` option accepts any S3-compatible endpoint URL. That
includes Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, or anything
else that speaks the S3 protocol:

```js
// Cloudflare R2
new Uppy().use(AwsS3, {
	s3Endpoint: 'https://<account-id>.r2.cloudflarestorage.com/my-bucket',
	getCredentials: () => fetchR2Credentials(),
});

// AWS S3 with Transfer Acceleration
new Uppy().use(AwsS3, {
	s3Endpoint: 'https://my-bucket.s3-accelerate.amazonaws.com',
	getCredentials: () => fetchCredentials(),
});
```

## Reliability improvements

Many of the old bugs came down to how Uppy events were wired around S3 ops. The
rewrite addresses these:

- Automatic retry with exponential backoff on 5xx and 429 errors.
- On `ExpiredToken`, the plugin clears its credential cache and retries with
  fresh credentials. No user intervention needed.
- Offline detection via `navigator.onLine`. Between requests, the client waits
  for the connection to come back before firing the next request, instead of
  failing the upload.
- Each file gets its own `S3Uploader` instance, so one stalled upload can’t
  corrupt another’s state.
- `allowedMetaFields` is now respected on remote uploads (Companion-backed
  provider files). The old plugin sent the full `file.meta` regardless, which
  could leak unwanted internal fields and risked hitting S3’s 2KB metadata
  limit.

To catch the kind of bugs unit tests miss (wrong query-parameter ordering,
broken canonical request strings, content-type mismatches), we run the S3 client
against a real S3-compatible server. A MinIO container is started in Docker by
Vitest setup hooks, every multipart operation runs end-to-end against it, and
the container is torn down after the suite. The same infrastructure means
contributors can reproduce signing bugs locally without hitting AWS.

## Migration guide

### From `endpoint` (Companion) mode

```js
// Before
new Uppy().use(AwsS3, {
	endpoint: 'https://companion.example',
});

// After
new Uppy().use(AwsS3, {
	companionEndpoint: 'https://companion.example',
});
```

### From `getTemporarySecurityCredentials`

```js
// Before
new Uppy().use(AwsS3, {
	endpoint: 'https://companion.example',
	getTemporarySecurityCredentials: true,
});

// After
new Uppy().use(AwsS3, {
	s3Endpoint: 'https://my-bucket.s3.us-east-1.amazonaws.com',
	region: 'us-east-1',
	getCredentials: async () => {
		const res = await fetch('/api/s3/sts');
		return res.json();
	},
});
```

### From custom callbacks

The old plugin had 6 separate callbacks, one per S3 operation, meaning your
backend had to expose and handle each operation individually. The new plugin
replaces all of them with a single `signRequest` and every operation is done
from the client side. The backend now only returns the presigned URL for that
operation.

```js
// Before: 6 separate callbacks
new Uppy().use(AwsS3, {
	getUploadParameters: (file) => {
		/* ... */
	},
	createMultipartUpload: (file) => {
		/* ... */
	},
	signPart: (file, partData) => {
		/* ... */
	},
	completeMultipartUpload: (file, data) => {
		/* ... */
	},
	abortMultipartUpload: (file, data) => {
		/* ... */
	},
	listParts: (file, data) => {
		/* ... */
	},
});

// After: one callback that switches on the operation
new Uppy().use(AwsS3, {
	signRequest: async ({ method, key, uploadId, partNumber }) => {
		const res = await fetch('/api/s3/sign', {
			method: 'POST',
			body: JSON.stringify({ method, key, uploadId, partNumber }),
		});
		return res.json(); // { url } or { url, key }
	},
});
```

Your `/api/s3/sign` endpoint receives `{ method, key, uploadId, partNumber }`
and returns a presigned URL for that operation. This consolidation means one
server route instead of six, with consistent flow and logging in one place. The
plugin owns the upload flow and backend is only used for signing.

If your backend generates its own object keys, see the
[`signRequest` docs](/docs/aws-s3/#signrequestrequest) and the
[migration guide](/docs/guides/migration-guides/#custom-signing-six-callbacks-become-signrequest)
for what changed from v5, why, and how to implement the signer correctly. See
also the
[Node.js](https://github.com/transloadit/uppy/blob/main/examples/aws-nodejs/routes/presign.js)
and
[PHP](https://github.com/transloadit/uppy/blob/main/examples/aws-php/s3-sign.php)
signer examples.

### Breaking changes

- **Removed:** `getUploadParameters`, `createMultipartUpload`, `signPart`,
  `listParts`, `completeMultipartUpload`, `abortMultipartUpload`,
  `getTemporarySecurityCredentials`, `uploadPartBytes`, `retryDelays`,
  `headers`, `cookiesRule`. There is currently no replacement for
  `headers`/`cookiesRule` if you used them for authenticated Companion setups.
  The bucket is now part of the `s3Endpoint` URL, e.g.,
  `https://my-bucket.s3.us-east-1.amazonaws.com`.
- **Renamed:** `endpoint` to `companionEndpoint`.
- **New:** `s3Endpoint` (required for `getCredentials` mode) and `region`
  (optional: comes from the `getCredentials` response or the option itself, and
  falls back to `auto`, which only works for region-less services like R2).
- **Required:** one of `getCredentials`, `signRequest`, or `companionEndpoint`.
- **Simplified:** `signRequest` and `companionEndpoint` modes need no other
  options. The upload location is derived from the presigned URL.
- **Companion:** server-side unchanged. Existing `/s3/*` endpoints continue to
  work. Only the client option name changed (`endpoint` → `companionEndpoint`).
