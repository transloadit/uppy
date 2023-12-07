import { beforeEach, describe, expect, it } from 'vitest'
import 'whatwg-fetch'
import Core from '@uppy/core'
import AwsS3 from './index.js'

describe('AwsS3', () => {
  it('Registers AwsS3 upload plugin', () => {
    const core = new Core()
    core.use(AwsS3)

    const pluginNames = core[Symbol.for('uppy test: getPlugins')]('uploader').map((plugin) => plugin.constructor.name)
    expect(pluginNames).toContain('AwsS3')
  })

  describe('getUploadParameters', () => {
    it('Throws an error if configured without companionUrl', () => {
      const core = new Core()
      core.use(AwsS3)
      const awsS3 = core.getPlugin('AwsS3')

      expect(awsS3.opts.getUploadParameters).toThrow()
    })

    it('Does not throw an error with companionUrl configured', () => {
      const core = new Core()
      core.use(AwsS3, { companionUrl: 'https://companion.uppy.io/' })
      const awsS3 = core.getPlugin('AwsS3')
      const file = {
        meta: {
          name: 'foo.jpg',
          type: 'image/jpg',
        },
      }

      expect(() => awsS3.opts.getUploadParameters(file)).not.toThrow()
    })
  })

  describe('dynamic companionHeader', () => {
    let core
    let awsS3
    const oldToken = 'old token'
    const newToken = 'new token'

    beforeEach(() => {
      core = new Core()
      core.use(AwsS3, {
        companionHeaders: {
          authorization: oldToken,
        },
      })
      awsS3 = core.getPlugin('AwsS3')
    })

    it('companionHeader is updated before uploading file', async () => {
      awsS3.setOptions({
        companionHeaders: {
          authorization: newToken,
        },
      })

      await core.upload()

      const client = awsS3[Symbol.for('uppy test: getClient')]()

      expect(client[Symbol.for('uppy test: getCompanionHeaders')]().authorization).toEqual(newToken)
    })
  })
})
