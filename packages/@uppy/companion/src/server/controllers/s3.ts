import type { Socket } from 'node:net'
import type { Part, S3Client } from '@aws-sdk/client-s3'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { GetFederationTokenCommand, STSClient } from '@aws-sdk/client-sts'
import {
  createPresignedPost,
  type PresignedPostOptions,
} from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextFunction, Request, Response, Router } from 'express'
import express from 'express'
import type { CompanionRuntimeOptions } from '../../types/companion-options.js'
import { isRecord } from '../helpers/type-guards.js'
import {
  getBucket,
  rfc2047EncodeMetadata,
  s3WriteParams,
  truncateFilename,
} from '../helpers/utils.js'
import logger from '../logger.js'

const maxBatchPartNumbers = 100

/** An integer from 1 to 10000, the part numbers S3 accepts. */
const isPartNumber = (value: string) =>
  /^[1-9]\d{0,4}$/.test(value) && Number(value) <= 10000

// Listings that need more than one ListParts page (over 1000 parts) take one
// of these process-wide slots for their remaining pages, so at most this many
// listings page through S3 at once. The first page never waits, so ordinary
// listings don't queue behind big ones.
const maxPagedListings = 4
let pagedListings = 0
const pagedListingWaiters = new Set<() => void>()

// The client has gone when its response closes, or its connection does:
// Node 22 never closes a response still queued behind another one on the
// same connection.
const clientGone = (res: Response) => res.destroyed || res.req.socket.destroyed

/** Calls `fn` once the client has gone; returns a function that stops that. */
function onClientGone(res: Response, fn: () => void): () => void {
  const { socket } = res.req
  if (clientGone(res)) {
    // not synchronously: callers name the returned stop in `fn`
    queueMicrotask(fn)
    return () => {}
  }
  const gone = () => {
    stop()
    fn()
  }
  const stop = () => {
    res.off('close', gone)
    socket.off('close', gone)
  }
  res.once('close', gone)
  socket.once('close', gone)
  return stop
}

/** Resolves with false, holding no slot, if `res` closes before one is free. */
function takePagedListingSlot(res: Response): Promise<boolean> {
  if (pagedListings < maxPagedListings) {
    pagedListings++
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    const take = () => {
      stop()
      resolve(true)
    }
    pagedListingWaiters.add(take)
    const stop = onClientGone(res, () => {
      pagedListingWaiters.delete(take)
      resolve(false)
    })
  })
}

function releasePagedListingSlot() {
  const [next] = pagedListingWaiters
  if (next) {
    // hand the slot straight to the longest waiter
    pagedListingWaiters.delete(next)
    next()
  } else {
    pagedListings--
  }
}

// Each connection runs one listing at a time, and starts the next only once
// the previous answer has been written out and the socket has drained.
// Pipelined requests are answered in order anyway, so a client loses nothing,
// and a connection that doesn't read holds at most one listing's answer.
const connectionListings = new WeakMap<Socket, Promise<void>>()

/** Resolves once `res` has been written out, or has closed. */
const responseDone = (res: Response) =>
  new Promise<void>((resolve) => {
    if (res.writableFinished) {
      resolve()
      return
    }
    const done = () => {
      res.off('finish', done)
      stop()
      resolve()
    }
    res.once('finish', done)
    const stop = onClientGone(res, done)
  })

/** Resolves with false if `res` closes before `socket` has drained. */
const socketDrained = (socket: Socket, res: Response) =>
  new Promise<boolean>((resolve) => {
    if (clientGone(res)) {
      resolve(false)
      return
    }
    if (!socket.writableNeedDrain) {
      resolve(true)
      return
    }
    const onDrain = () => {
      stop()
      resolve(true)
    }
    socket.once('drain', onDrain)
    const stop = onClientGone(res, () => {
      socket.off('drain', onDrain)
      resolve(false)
    })
  })

/**
 * Every part of a multipart upload, or undefined if the client of `res` went
 * away first, in which case nothing more is fetched and the ListParts call in
 * flight is cancelled.
 */
function listAllParts(
  client: S3Client,
  input: { Bucket: string; Key: string; UploadId: string },
  req: Request,
  res: Response,
): Promise<Part[] | undefined> {
  const { socket } = req
  const previous = connectionListings.get(socket) ?? Promise.resolve()
  const listing = previous.then(async () =>
    (await socketDrained(socket, res))
      ? fetchAllParts(client, input, res)
      : undefined,
  )
  connectionListings.set(
    socket,
    listing.then(
      () => responseDone(res),
      () => responseDone(res),
    ),
  )
  return listing
}

async function fetchAllParts(
  client: S3Client,
  input: { Bucket: string; Key: string; UploadId: string },
  res: Response,
): Promise<Part[] | undefined> {
  const abort = new AbortController()
  const stopWatching = onClientGone(res, () => abort.abort())
  const listPage = (PartNumberMarker?: string) =>
    client.send(new ListPartsCommand({ ...input, PartNumberMarker }), {
      abortSignal: abort.signal,
    })
  let holdsSlot = false
  try {
    let page = await listPage()
    if (clientGone(res)) return undefined
    const parts = page.Parts ?? []
    if (!page.IsTruncated) return parts

    holdsSlot = await takePagedListingSlot(res)
    if (!holdsSlot) return undefined
    while (page.IsTruncated) {
      page = await listPage(page.NextPartNumberMarker)
      if (clientGone(res)) return undefined
      if (page.Parts) parts.push(...page.Parts)
    }
    return parts
  } catch (err) {
    // the call was cancelled because the client has gone
    if (clientGone(res)) {
      logger.debug(err, 's3.listParts.client.gone', res.req.id)
      return undefined
    }
    throw err
  } finally {
    stopWatching()
    if (holdsSlot) releasePagedListingSlot()
  }
}

type Conditions = PresignedPostOptions['Conditions']

/**
 * Whether `contentType` passes the Content-Type conditions, as an S3 POST
 * policy checks them. Other conditions are ignored.
 */
function contentTypeAllowed(conditions: Conditions, contentType: string) {
  return (conditions ?? []).every((condition) => {
    if (!Array.isArray(condition)) {
      return Object.entries(condition).every(
        ([field, value]) =>
          field.toLowerCase() !== 'content-type' || contentType === value,
      )
    }
    const [operator, field, value] = condition
    if (String(field).toLowerCase() !== '$content-type') return true
    switch (String(operator).toLowerCase()) {
      case 'eq':
        return contentType === value
      case 'starts-with':
        // a comma-separated list passes only if every type in it does
        return contentType
          .split(',')
          .every((type) => type.trim().startsWith(String(value)))
      default:
        return true
    }
  })
}

// NaN unless a number or a numeric string; null, '' and booleans don't count
const toLength = (value: unknown) =>
  typeof value === 'number' ||
  (typeof value === 'string' && value.trim() !== '')
    ? Number(value)
    : Number.NaN

/** The [min, max] of each `content-length-range` condition. */
const contentLengthRanges = (conditions: Conditions) =>
  (conditions ?? []).flatMap((condition) =>
    Array.isArray(condition) &&
    String(condition[0]).toLowerCase() === 'content-length-range'
      ? [[toLength(condition[1]), toLength(condition[2])] as const]
      : [],
  )

// ListParts quotes ETags; Uppy sends them without.
const unquote = (etag: string) => etag.replace(/^"|"$/g, '')

export default function s3(
  config: Pick<
    CompanionRuntimeOptions['s3'],
    | 'acl'
    | 'awsSse'
    | 'awsSseKmsKeyId'
    | 'getKey'
    | 'expires'
    | 'conditions'
    | 'bucket'
    | 'region'
    | 'key'
    | 'secret'
  >,
): Router {
  if (typeof config.acl !== 'string' && config.acl != null) {
    throw new TypeError('s3: The `acl` option must be a string or null')
  }
  if (typeof config.getKey !== 'function') {
    throw new TypeError('s3: The `getKey` option must be a function')
  }
  // A range no size can satisfy would abort every multipart upload on completion.
  for (const [min, max] of contentLengthRanges(config.conditions)) {
    if (!(min >= 0 && max >= min && Number.isFinite(max))) {
      throw new TypeError(
        's3: A `content-length-range` condition needs a minimum and maximum size, with 0 <= minimum <= maximum',
      )
    }
  }

  function getS3Client(
    req: Request,
    res: Response,
    createPresignedPostMode = false,
  ): S3Client | undefined {
    const client = createPresignedPostMode
      ? req.companion.s3ClientCreatePresignedPost
      : req.companion.s3Client
    if (!client)
      res.status(400).json({
        error: 'This Companion server does not support uploading to S3',
      })
    return client
  }

  /**
   * The client and target of a multipart upload request (`:uploadId` and
   * `?key=`), or undefined after answering with an error. The bucket is left
   * to the caller, so a `bucket` function only runs for requests that pass
   * the caller's own checks.
   */
  function getMultipartTarget(
    req: Request,
    res: Response,
  ): { client: S3Client; uploadId: string; key: string } | undefined {
    const client = getS3Client(req, res)
    if (!client) return undefined
    const uploadId = req.params['uploadId']
    const key = req.query['key']
    if (typeof uploadId !== 'string' || uploadId.length === 0) {
      res.status(400).json({ error: 's3: uploadId must be provided.' })
      return undefined
    }
    if (typeof key !== 'string') {
      res.status(400).json({
        error:
          's3: the object key must be passed as a query parameter. For example: "?key=abc.jpg"',
      })
      return undefined
    }
    return { client, uploadId, key }
  }

  /**
   * Get upload paramaters for a simple direct upload.
   *
   * Expected query parameters:
   *  - filename - The name of the file, given to the `config.getKey`
   *    option to determine the object key name in the S3 bucket.
   *  - type - The MIME type of the file.
   *  - metadata - Key/value pairs configuring S3 metadata. Both must be ASCII-safe.
   *    Query parameters are formatted like `metadata[name]=value`.
   *
   * Response JSON:
   *  - method - The HTTP method to use to upload.
   *  - url - The URL to upload to.
   *  - fields - Form fields to send along.
   */
  function getUploadParameters(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const client = getS3Client(req, res, true)
    if (!client) return

    const filename = req.query['filename']
    const metadata = isRecord(req.query['metadata'])
      ? req.query['metadata']
      : {}

    // Validate filename is provided and non-empty
    if (typeof filename !== 'string' || filename === '') {
      res.status(400).json({
        error:
          's3: the "filename" query parameter is required and must be a non-empty string',
      })
      return
    }

    const truncatedFilename = truncateFilename(
      filename,
      req.companion.options.maxFilenameLength,
    )

    const bucket = getBucket({
      bucketOrFn: config.bucket,
      req,
      filename: truncatedFilename,
      metadata,
    })

    const key = config.getKey({ req, filename: truncatedFilename, metadata })
    if (typeof key !== 'string') {
      res.status(500).json({
        error:
          'S3 uploads are misconfigured: filename returned from `getKey` must be a string',
      })
      return
    }

    const fields: Record<string, string> = {
      success_action_status: '201',
      ...(typeof req.query['type'] === 'string' && {
        'content-type': req.query['type'],
      }),
    }

    if (config.acl != null) fields['acl'] = config.acl

    if (config.awsSse != null) {
      fields['x-amz-server-side-encryption'] = config.awsSse
    }
    if (config.awsSseKmsKeyId != null) {
      fields['x-amz-server-side-encryption-aws-kms-key-id'] =
        config.awsSseKmsKeyId
    }

    for (const [metadataKey, value] of Object.entries(metadata)) {
      if (typeof value !== 'string') continue
      fields[`x-amz-meta-${metadataKey}`] = value
    }

    // `createPresignedPost` sometimes pulls in a nested copy of `@aws-sdk/client-s3`,
    // which makes the `S3Client` type nominally incompatible. The instance is still
    // compatible at runtime.
    createPresignedPost(client, {
      Bucket: bucket,
      Expires: config.expires,
      Fields: fields,
      Conditions: config.conditions,
      Key: key,
    }).then((data) => {
      res.json({
        method: 'POST',
        url: data.url,
        fields: data.fields,
        expires: config.expires,
      })
    }, next)
  }

  /**
   * Create an S3 multipart upload. With this, files can be uploaded in chunks of 5MB+ each.
   *
   * Expected JSON body:
   *  - filename - The name of the file, given to the `config.getKey`
   *    option to determine the object key name in the S3 bucket.
   *  - type - The MIME type of the file.
   *  - metadata - An object with the key/value pairs to set as metadata.
   *    Keys and values must be ASCII-safe for S3.
   *
   * Response JSON:
   *  - key - The object key in the S3 bucket.
   *  - uploadId - The ID of this multipart upload, to be used in later requests.
   */
  function createMultipartUpload(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const client = getS3Client(req, res)
    if (!client) return

    const {
      type,
      filename,
      metadata: maybeMetadata,
    }: { type: unknown; filename: unknown; metadata: unknown } = req.body

    const metadata = isRecord(maybeMetadata) ? maybeMetadata : {}

    // Validate filename is provided and non-empty
    if (typeof filename !== 'string' || filename === '') {
      res.status(400).json({
        error:
          's3: the "filename" field is required and must be a non-empty string',
      })
      return
    }

    const truncatedFilename = truncateFilename(
      filename,
      req.companion.options.maxFilenameLength,
    )

    const bucket = getBucket({
      bucketOrFn: config.bucket,
      req,
      filename: truncatedFilename,
      metadata,
    })

    const key = config.getKey({ req, filename: truncatedFilename, metadata })

    if (typeof key !== 'string') {
      res.status(500).json({
        error: 's3: filename returned from `getKey` must be a string',
      })
      return
    }
    if (typeof type !== 'string') {
      res.status(400).json({ error: 's3: content type must be a string' })
      return
    }
    // S3 applies `conditions` to /s3/params uploads only, so check what we can.
    if (!contentTypeAllowed(config.conditions, type)) {
      res.status(400).json({ error: 's3: this content type is not allowed' })
      return
    }

    const params = {
      Bucket: bucket,
      Key: key,
      ContentType: type,
      Metadata: rfc2047EncodeMetadata(metadata),
      ...s3WriteParams(config),
    }

    client.send(new CreateMultipartUploadCommand(params)).then((data) => {
      res.json({
        key: data.Key,
        uploadId: data.UploadId,
        bucket: data.Bucket,
      })
    }, next)
  }

  /**
   * List parts that have been fully uploaded so far.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *  - An array of objects representing parts:
   *     - PartNumber - the index of this part.
   *     - ETag - a hash of this part's contents, used to refer to it.
   *     - Size - size of this part.
   */
  function getUploadedParts(req: Request, res: Response, next: NextFunction) {
    const target = getMultipartTarget(req, res)
    if (!target) return
    const { client, uploadId, key } = target
    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    listAllParts(
      client,
      { Bucket: bucket, Key: key, UploadId: uploadId },
      req,
      res,
    ).then((parts) => {
      // undefined: the client has gone, so there is no one to answer
      if (parts) res.json(parts)
    }, next)
  }

  /**
   * Get parameters for uploading one part.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   *  - partNumber - This part's index in the file (1-10000).
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *  - url - The URL to upload to, including signed query parameters.
   */
  function signPartUpload(req: Request, res: Response, next: NextFunction) {
    const target = getMultipartTarget(req, res)
    if (!target) return
    const { client, uploadId, key } = target

    const partNumber = req.params['partNumber']
    if (typeof partNumber !== 'string' || !parseInt(partNumber, 10)) {
      res.status(400).json({
        error: 's3: the part number must be a number between 1 and 10000.',
      })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: Number(partNumber),
        Body: '',
      }),
      { expiresIn: config.expires },
    ).then((url) => {
      res.json({ url, expires: config.expires })
    }, next)
  }

  /**
   * Get parameters for uploading a batch of parts.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   *  - partNumbers - A comma separated list of part numbers representing
   *                  indecies in the file (1-10000).
   * Response JSON:
   *  - presignedUrls - The URLs to upload to, including signed query parameters,
   *                    in an object mapped to part numbers.
   */
  function batchSignPartsUpload(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const target = getMultipartTarget(req, res)
    if (!target) return
    const { client, uploadId, key } = target

    const partNumbers = req.query['partNumbers']
    if (typeof partNumbers !== 'string') {
      res.status(400).json({
        error:
          's3: the part numbers must be passed as a comma separated query parameter. For example: "?partNumbers=4,6,7,21"',
      })
      return
    }

    const partNumbersArray = partNumbers.split(',')
    // Signing is synchronous CPU work, so a long list would block the event loop.
    if (partNumbersArray.length > maxBatchPartNumbers) {
      res.status(400).json({
        error: `s3: at most ${maxBatchPartNumbers} part numbers can be signed per request.`,
      })
      return
    }
    if (!partNumbersArray.every(isPartNumber)) {
      res.status(400).json({
        error: 's3: the part numbers must be a number between 1 and 10000.',
      })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    Promise.all(
      partNumbersArray.map((partNumber) => {
        return getSignedUrl(
          client,
          new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: Number(partNumber),
            Body: '',
          }),
          { expiresIn: config.expires },
        )
      }),
    )
      .then((urls) => {
        const presignedUrls: Record<string, string> = Object.create(null)
        for (let index = 0; index < partNumbersArray.length; index++) {
          const partNumber = partNumbersArray[index]
          const url = urls[index]
          if (!partNumber || !url) continue
          presignedUrls[partNumber] = url
        }
        res.json({ presignedUrls })
      })
      .catch(next)
  }

  /**
   * Abort a multipart upload, deleting already uploaded parts.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Response JSON:
   *   Empty.
   */
  function abortMultipartUpload(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const target = getMultipartTarget(req, res)
    if (!target) return
    const { client, uploadId, key } = target
    const bucket = getBucket({ bucketOrFn: config.bucket, req })

    client
      .send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
        }),
      )
      .then(() => res.json({}), next)
  }

  /**
   * Whether the parts to combine add up to a size the `content-length-range`
   * conditions allow, which S3 doesn't check for multipart uploads. If not,
   * this aborts the upload and answers the request; it also answers when the
   * parts don't match the uploaded ones, and gives up if the client has gone.
   */
  async function partsSizeAllowed(
    client: S3Client,
    input: { Bucket: string; Key: string; UploadId: string },
    parts: { PartNumber: number; ETag: string }[],
    req: Request,
    res: Response,
  ): Promise<boolean> {
    const ranges = contentLengthRanges(config.conditions)
    if (ranges.length === 0) return true

    const uploaded = await listAllParts(client, input, req, res)
    if (!uploaded) return false
    const byNumber = new Map(uploaded.map((part) => [part.PartNumber, part]))
    let size = 0
    for (const { PartNumber, ETag } of parts) {
      const part = byNumber.get(PartNumber)
      // matching ETags makes the size checked the size S3 combines
      if (
        part?.ETag == null ||
        part.Size == null ||
        unquote(part.ETag) !== unquote(ETag)
      ) {
        res.status(400).json({
          error: 's3: `parts` do not match the uploaded parts.',
        })
        return false
      }
      size += part.Size
      byNumber.delete(PartNumber) // each part counts once
    }
    if (ranges.every(([min, max]) => size >= min && size <= max)) return true

    await client.send(new AbortMultipartUploadCommand(input))
    res.status(400).json({
      error: 's3: the file size is outside the allowed range',
    })
    return false
  }

  /**
   * Complete a multipart upload, combining all the parts into a single object in the S3 bucket.
   *
   * Expected URL parameters:
   *  - uploadId - The uploadId returned from `createMultipartUpload`.
   * Expected query parameters:
   *  - key - The object key in the S3 bucket.
   * Expected JSON body:
   *  - parts - An array of parts, see the `getUploadedParts` response JSON.
   * Response JSON:
   *  - location - The full URL to the object in the S3 bucket.
   */
  function completeMultipartUpload(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const target = getMultipartTarget(req, res)
    if (!target) return
    const { client, uploadId, key } = target

    const { parts }: { parts: unknown } = req.body
    if (
      !Array.isArray(parts) ||
      !parts.every(
        (part) =>
          typeof part === 'object' &&
          typeof part?.PartNumber === 'number' &&
          typeof part.ETag === 'string',
      )
    ) {
      res.status(400).json({
        error: 's3: `parts` must be an array of {ETag, PartNumber} objects.',
      })
      return
    }

    const bucket = getBucket({ bucketOrFn: config.bucket, req })
    const input = { Bucket: bucket, Key: key, UploadId: uploadId }

    partsSizeAllowed(client, input, parts, req, res)
      .then(async (allowed) => {
        if (!allowed) return
        const data = await client.send(
          new CompleteMultipartUploadCommand({
            ...input,
            MultipartUpload: {
              Parts: parts,
            },
          }),
        )
        res.json({
          location: data.Location,
          key: data.Key,
          bucket: data.Bucket,
        })
      })
      .catch(next)
  }

  const policy = {
    Version: '2012-10-17', // latest at the time of writing
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: [
          `arn:aws:s3:::${config.bucket}/*`,
          `arn:aws:s3:::${config.bucket}`,
        ],
      },
    ],
  }

  let stsClient: STSClient | undefined
  function getSTSClient(): STSClient | null {
    if (config.region == null || config.key == null || config.secret == null) {
      return null
    }
    if (stsClient == null) {
      stsClient = new STSClient({
        region: config.region,
        credentials: {
          accessKeyId: config.key,
          secretAccessKey: config.secret,
        },
      })
    }
    return stsClient
  }

  /**
   * Create STS credentials with the permission for sending PutObject/UploadPart to the bucket.
   *
   * Clients should cache the response and re-use it until they can reasonably
   * expect uploads to complete before the token expires. To this effect, the
   * Cache-Control header is set to invalidate the cache 5 minutes before the
   * token expires.
   *
   * Response JSON:
   * - credentials: the credentials including the SessionToken.
   * - bucket: the S3 bucket name.
   * - region: the region where that bucket is stored.
   */
  function getTemporarySecurityCredentials(
    _req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const sts = getSTSClient()
    if (!sts || typeof config.bucket !== 'string') {
      res.status(400).json({
        error: 'This Companion server does not support STS credentials',
      })
      return
    }

    sts
      .send(
        new GetFederationTokenCommand({
          // Name of the federated user. The name is used as an identifier for the
          // temporary security credentials (such as Bob). For example, you can
          // reference the federated user name in a resource-based policy, such as
          // in an Amazon S3 bucket policy.
          // Companion is configured by default as an unprotected public endpoint,
          // if you implement your own custom endpoint with user authentication you
          // should probably use different names for each of your users.
          Name: 'companion',
          // The duration, in seconds, of the role session. The value specified
          // can range from 900 seconds (15 minutes) up to the maximum session
          // duration set for the role.
          DurationSeconds: config.expires,
          Policy: JSON.stringify(policy),
        }),
      )
      .then((response) => {
        // This is a public unprotected endpoint.
        // If you implement your own custom endpoint with user authentication you
        // should probably use `private` instead of `public`.
        res.setHeader('Cache-Control', `public,max-age=${config.expires - 300}`) // 300s is 5min.
        res.json({
          credentials: response.Credentials,
          bucket: config.bucket,
          region: config.region,
        })
      }, next)
  }

  if (config.bucket == null) {
    return express.Router() // empty router because s3 is not enabled
  }

  return (
    express
      .Router()
      .get('/sts', getTemporarySecurityCredentials)
      .get('/params', getUploadParameters)
      .post(
        '/multipart',
        express.json({ inflate: false }),
        createMultipartUpload,
      )
      .get('/multipart/:uploadId', getUploadedParts)
      .get('/multipart/:uploadId/batch', batchSignPartsUpload)
      .get('/multipart/:uploadId/:partNumber', signPartUpload)
      // limit 1mb because maybe large upload with a lot of parts, see https://github.com/transloadit/uppy/issues/1945
      .post(
        '/multipart/:uploadId/complete',
        express.json({ limit: '1mb', inflate: false }),
        completeMultipartUpload,
      )
      .delete('/multipart/:uploadId', abortMultipartUpload)
  )
}
