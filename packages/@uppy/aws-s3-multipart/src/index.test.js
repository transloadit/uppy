require('whatwg-fetch')
const Core = require('@uppy/core')
const AwsS3Multipart = require('.')

describe('AwsS3Multipart', () => {
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
})
