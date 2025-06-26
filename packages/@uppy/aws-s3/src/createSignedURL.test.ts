import assert from 'node:assert'
import {
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { afterEach, beforeEach, describe, it } from 'vitest'
import createSignedURL from './createSignedURL.js'

const bucketName = 'some-bucket.with.dots'
const s3ClientOptions = {
  region: 'us-bar-1',
  credentials: {
    accessKeyId: 'foo',
    secretAccessKey: 'bar',
    sessionToken: 'foobar',
  },
}
const { Date: OriginalDate } = globalThis

describe('createSignedURL', () => {
  beforeEach(() => {
    const now_ms = OriginalDate.now()
    // @ts-expect-error we're touching globals for test purposes.
    // biome-ignore lint/suspicious/noShadowRestrictedNames: ...
    globalThis.Date = function Date() {
      if (new.target) {
        return Reflect.construct(OriginalDate, [now_ms])
      }
      return Reflect.apply(OriginalDate, this, [now_ms])
    }
    globalThis.Date.now = function now() {
      return now_ms
    }
  })
  afterEach(() => {
    globalThis.Date = OriginalDate
  })
  it('should be able to sign non-multipart upload', async () => {
    const client = new S3Client(s3ClientOptions)
    assert.strictEqual(
      (
        await createSignedURL({
          accountKey: s3ClientOptions.credentials.accessKeyId,
          accountSecret: s3ClientOptions.credentials.secretAccessKey,
          sessionToken: s3ClientOptions.credentials.sessionToken,
          bucketName,
          Key: 'some/key',
          Region: s3ClientOptions.region,
          expires: 900,
        })
      ).searchParams.get('X-Amz-Signature'),
      new URL(
        await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: bucketName,
            Key: 'some/key',
          }),
          { expiresIn: 900 },
        ),
      ).searchParams.get('X-Amz-Signature'),
    )
  })
  it('should be able to sign multipart upload', async () => {
    const client = new S3Client(s3ClientOptions)
    const partNumber = 99
    const uploadId = 'dummyUploadId'
    assert.strictEqual(
      (
        await createSignedURL({
          accountKey: s3ClientOptions.credentials.accessKeyId,
          accountSecret: s3ClientOptions.credentials.secretAccessKey,
          sessionToken: s3ClientOptions.credentials.sessionToken,
          uploadId,
          partNumber,
          bucketName,
          Key: 'some/key',
          Region: s3ClientOptions.region,
          expires: 900,
        })
      ).searchParams.get('X-Amz-Signature'),
      new URL(
        await getSignedUrl(
          client,
          new UploadPartCommand({
            Bucket: bucketName,
            UploadId: uploadId,
            PartNumber: partNumber,
            Key: 'some/key',
          }),
          { expiresIn: 900 },
        ),
      ).searchParams.get('X-Amz-Signature'),
    )
  })

  it('should escape path and query as restricted to RFC 3986', async () => {
    const client = new S3Client(s3ClientOptions)
    const partNumber = 99
    const specialChars = ";?:@&=+$,#!'()"
    const uploadId = `Upload${specialChars}Id`
    // '.*' chars of path should be encoded
    const Key = `${specialChars}.*/${specialChars}.*.ext`
    const implResult = await createSignedURL({
      accountKey: s3ClientOptions.credentials.accessKeyId,
      accountSecret: s3ClientOptions.credentials.secretAccessKey,
      sessionToken: s3ClientOptions.credentials.sessionToken,
      uploadId,
      partNumber,
      bucketName,
      Key,
      Region: s3ClientOptions.region,
      expires: 900,
    })
    const sdkResult = new URL(
      await getSignedUrl(
        client,
        new UploadPartCommand({
          Bucket: bucketName,
          UploadId: uploadId,
          PartNumber: partNumber,
          Key,
        }),
        { expiresIn: 900 },
      ),
    )
    assert.strictEqual(implResult.pathname, sdkResult.pathname)

    const extractUploadId = /([?&])uploadId=([^&]+?)(&|$)/
    const extractSignature = /([?&])X-Amz-Signature=([^&]+?)(&|$)/
    assert.strictEqual(
      implResult.search.match(extractUploadId)![2],
      sdkResult.search.match(extractUploadId)![2],
    )
    assert.strictEqual(
      implResult.search.match(extractSignature)![2],
      sdkResult.search.match(extractSignature)![2],
    )
  })
})
