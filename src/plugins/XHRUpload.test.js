const nock = require('nock')
const Core = require('../core')
const XHRUpload = require('./XHRUpload')

describe('XHRUpload', () => {
  describe('getResponseData', () => {
    it('has the XHRUpload options as its `this`', () => {
      nock('https://fake-endpoint.uppy.io')
        .defaultReplyHeaders({
          'access-control-allow-method': 'POST',
          'access-control-allow-origin': '*'
        })
        .options('/').reply(200, {})
        .post('/').reply(200, {})

      const core = new Core({ autoProceed: false, debug: true })
      const getResponseData = jest.fn(function () {
        expect(this.some).toEqual('option')
        return {}
      })
      core.use(XHRUpload, {
        id: 'XHRUpload',
        endpoint: 'https://fake-endpoint.uppy.io',
        some: 'option',
        getResponseData
      })
      core.addFile({
        name: 'test.jpg',
        data: new Blob([Buffer.alloc(8192)])
      })

      return core.upload().then(() => {
        expect(getResponseData).toHaveBeenCalled()
      })
    })
  })
})
