require('whatwg-fetch')
const nock = require('nock')
const Core = require('@uppy/core')
const AwsS3Multipart = require('.')

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
    })
  })

  describe('without companionUrl (custom main functions)', () => {
    const core = new Core()
    core.use(AwsS3Multipart, {
      createMultipartUpload: jest.fn(() => {
        return {
          uploadId: '6aeb1980f3fc7ce0b5454d25b71992',
          key: 'test/upload/file3.jpg',
        }
      }),
      completeMultipartUpload: jest.fn(() => Promise.resolve({ location: 'test' })),
      abortMultipartUpload: jest.fn(),
      prepareUploadPart: jest.fn((file, { key, uploadId, number }) => {
        return {
          url: 'https://bucket.s3.us-east-2.amazonaws.com/test/upload/file3.jpg',
        }
      }),
    })
    const awsS3Multipart = core.getPlugin('AwsS3Multipart')

    afterEach(() => {
      core.reset()
    })

    it('Calls prepareUploadPart N times, where N is fileSize / getChunkSize()', (done) => {
      const scope = nock('https://bucket.s3.us-east-2.amazonaws.com')
        .defaultReplyHeaders({
          'access-control-allow-method': 'PUT',
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'ETag'
        })
      scope.options(uri => uri.includes('test'))
        .reply(200, "", { ETag: "test" })
      scope.put(uri => uri.includes('test/upload/file3.jpg'))
        .reply(200, "", { ETag: "test" })

      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(20971520)], { type: 'application/octet-stream' }),
      })
      core.upload().then(() => {
        expect(awsS3Multipart.opts.prepareUploadPart.mock.calls.length).toEqual(4)
        done()
      })
    })

    it('Throws an error if prepareUploadPart does not return an object with a url', (done) => {
      awsS3Multipart.opts.prepareUploadPart = jest.fn(() => null)
      core.addFile({
        source: 'jest',
        name: 'multitest.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(5242880)], { type: 'application/octet-stream' }),
      })
      core
        .upload()
        .then(() => {})
        .catch((err) => {
          expect(err.message).toEqual("AwsS3/Multipart: Got incorrect result from `prepareUploadPart()`, expected an object `{ url }`.")
          done()
        })
    })
  })
})
