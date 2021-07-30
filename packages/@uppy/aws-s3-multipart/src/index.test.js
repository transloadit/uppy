require('whatwg-fetch')
const nock = require('nock')
const Core = require('@uppy/core')
const AwsS3Multipart = require('.')

const KB = 1024
const MB = KB * KB

describe('AwsS3Multipart', () => {
  beforeEach(() => nock.disableNetConnect())

  it('Registers AwsS3Multipart upload plugin', () => {
    const core = new Core()
    core.use(AwsS3Multipart)

    const pluginNames = core.plugins.uploader.map((plugin) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3Multipart')
  })

  describe('companionUrl assertion', () => {
    it('Throws an error for main functions if configured without companionUrl', () => {
      const core = new Core()
      core.use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')

      const err = 'Expected a `companionUrl` option'
      const file = {}
      const opts = {}

      expect(() => awsS3Multipart.opts.createMultipartUpload(file)).toThrow(err)
      expect(() => awsS3Multipart.opts.listParts(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.prepareUploadPart(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.completeMultipartUpload(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.abortMultipartUpload(file, opts)).toThrow(err)
      expect(() => awsS3Multipart.opts.batchPrepareUploadParts(file, opts)).toThrow(err)
    })
  })

  describe('without companionUrl (custom main functions)', () => {
    let core
    let awsS3Multipart

    beforeEach(() => {
      core = new Core()
      core.use(AwsS3Multipart, {
        createMultipartUpload: jest.fn(() => {
          return {
            uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
            key: 'test/upload/multitest.bat',
          }
        }),
        completeMultipartUpload: jest.fn(() => Promise.resolve({ location: 'test' })),
        abortMultipartUpload: jest.fn(),
        prepareUploadPart: jest.fn((file, { number }) => {
          return {
            url: `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.bat?partNumber=${number}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`,
          }
        }),
        batchPrepareUploadParts: jest.fn(() => {
          const presignedUrls = {}
          const possiblePartNumbers = [1, 2, 3, 4, 5, 6, 7]
          possiblePartNumbers.forEach((partNumber) => {
            presignedUrls[partNumber] = `https://bucket.s3.us-east-2.amazonaws.com/test/upload/multitest.bat?partNumber=${partNumber}&uploadId=6aeb1980f3fc7ce0b5454d25b71992&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATEST%2F20210729%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210729T014044Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`
          })
          return { presignedUrls }
        }),
      })
      awsS3Multipart = core.getPlugin('AwsS3Multipart')
    })

    it('Calls prepareUploadPart N times, where N is fileSize / getChunkSize()', (done) => {
      const scope = nock('https://bucket.s3.us-east-2.amazonaws.com').defaultReplyHeaders({
        'access-control-allow-method': 'PUT',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag',
      })
      scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
      scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
      scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test1' })
      scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test2' })

      // 6MB file will give us 2 chunks, so there will be 2 PUT and 2 OPTIONS
      // calls to the presigned URL from 2 prepareUploadPart calls
      const fileSize = 5 * MB + 1 * MB
      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(fileSize)], { type: 'application/octet-stream' }),
      })
      core.upload().then(() => {
        expect(awsS3Multipart.opts.prepareUploadPart.mock.calls.length).toEqual(2)
        scope.done()
        done()
      })
    })

    it('Throws an error if prepareUploadPart does not return an object with a url', (done) => {
      awsS3Multipart.opts.prepareUploadPart = jest.fn(() => { return {} })
      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(2 * KB)], { type: 'application/octet-stream' }),
      })
      core
        .upload()
        .then(() => {})
        .catch((err) => {
          expect(err.message).toEqual(
            'AwsS3/Multipart: Got incorrect result from `prepareUploadPart()`, expected an object `{ url }`.'
          )
          done()
        })
    })

    describe('with batchPartPresign enabled', () => {
      beforeEach(() => {
        awsS3Multipart.opts.batchPartPresign = true
      })

      it('Calls the batchPrepareUploadParts function totalChunks / limit times', done => {
        const scope = nock('https://bucket.s3.us-east-2.amazonaws.com').defaultReplyHeaders({
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
        scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
        scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test1' })
        scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test2' })

        // 6MB file will give us 2 chunks, so there will be 2 PUT and 2 OPTIONS
        // calls to the presigned URL from 1 batchPrepareUploadParts calls
        const fileSize = 5 * MB + 1 * MB
        core.addFile({
          source: 'jest',
          name: 'multitest.dat',
          type: 'application/octet-stream',
          data: new File([Buffer.alloc(fileSize)], { type: 'application/octet-stream' }),
        })
        core.upload().then(() => {
          expect(awsS3Multipart.opts.batchPrepareUploadParts.mock.calls.length).toEqual(1)
          expect(awsS3Multipart.opts.prepareUploadPart.mock.calls.length).toEqual(0)
          scope.done()
          done()
        })
      })

      it('Does not call batchPrepareUploadParts one at a time for the remaining chunks after the first limit batch', done => {
        const scope = nock('https://bucket.s3.us-east-2.amazonaws.com').defaultReplyHeaders({
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
        scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test' })
        scope.persist()

        // 32MB file will give us 7 chunks, so there will be 7 PUT and 7 OPTIONS
        // calls to the presigned URL from 2 batchPrepareUploadParts calls
        const fileSize = 30 * MB + 2 * MB
        core.addFile({
          source: 'jest',
          name: 'multitest.dat',
          type: 'application/octet-stream',
          data: new File([Buffer.alloc(fileSize)], { type: 'application/octet-stream' }),
        })
        core.upload().then(() => {
          expect(awsS3Multipart.opts.batchPrepareUploadParts.mock.calls.length).toEqual(2)
          expect(awsS3Multipart.opts.prepareUploadPart.mock.calls.length).toEqual(0)
          done()
        })
      })

      it('Does not allow for a minNeededForPresignBatch to be > limit, which would cause an infinite loop', done => {
        awsS3Multipart.opts.minNeededForPresignBatch = 200

        const scope = nock('https://bucket.s3.us-east-2.amazonaws.com').defaultReplyHeaders({
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag',
        })
        scope.options((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '')
        scope.put((uri) => uri.includes('test/upload/multitest.bat')).reply(200, '', { ETag: 'test' })
        scope.persist()

        // 32MB file will give us 7 chunks, so there will be 7 PUT and 7 OPTIONS
        // calls to the presigned URL from 2 batchPrepareUploadParts calls (need 5
        // based on limit then need 5 again based on limit but only actually doing 2,
        // because we are not using minNeededForPresignBatch if it exceeds limit)
        const fileSize = 30 * MB + 2 * MB
        core.addFile({
          source: 'jest',
          name: 'multitest.dat',
          type: 'application/octet-stream',
          data: new File([Buffer.alloc(fileSize)], { type: 'application/octet-stream' }),
        })
        core.upload().then(() => {
          expect(awsS3Multipart.opts.batchPrepareUploadParts.mock.calls.length).toEqual(2)
          expect(awsS3Multipart.opts.prepareUploadPart.mock.calls.length).toEqual(0)
          done()
        })
      })
    })
  })
})
