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

  describe('prepareUploadPart', () => {
    it('Throws an error if configured without companionUrl', () => {
      const core = new Core()
      core.use(AwsS3Multipart)
      const awsS3Multipart = core.getPlugin('AwsS3Multipart')

      expect(awsS3Multipart.opts.prepareUploadPart).toThrow()
    })
  })
})
