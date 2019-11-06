const Core = require('@uppy/core')
const AwsS3 = require('./')

describe('AwsS3', () => {
  it('Registers AwsS3 upload plugin', () => {
    const core = new Core()
    core.use(AwsS3)

    const pluginNames = core.plugins.uploader.map((plugin) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3')
  })
})
