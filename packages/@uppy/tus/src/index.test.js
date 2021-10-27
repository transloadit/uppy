const Core = require('@uppy/core')
const nock = require('nock')

const Tus = require('.')

const KB = 1024

describe('Tus', () => {
  it('Throws errors if autoRetry option is passed', () => {
    const uppy = new Core()
    const errorMsg = /The `autoRetry` option was deprecated and has been removed/

    expect(() => uppy.use(Tus, { autoRetry: true })).toThrowError(errorMsg)
    expect(() => uppy.use(Tus, { autoRetry: false })).toThrowError(errorMsg)
    expect(() => uppy.use(Tus, { autoRetry: undefined })).toThrowError(errorMsg)
  })

  it('should do POST request again when retrying', async () => {
    const uppy = new Core()
    const endpoint = 'https://tusd.tusdemo.net/files/'
    const scope = nock(endpoint)

    scope.post('/').reply(201)

    uppy.use(Tus, { endpoint })
    uppy.addFile({
      source: 'jest',
      name: 'foo1.jpg',
      type: 'image/jpeg',
      data: new File([Buffer.alloc(KB)], { type: 'image/jpeg' }),
    })
    uppy.on('complete', (result) => expect(result.successful.length).toEqual(1))

    await uppy.upload()

    scope.done()
  })
})
