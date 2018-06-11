const getArrayBuffer = require('./getArrayBuffer')

describe('getArrayBuffer', () => {
  beforeEach(() => {
    global.FileReader = class FileReader {
      addEventListener (e, cb) {
        if (e === 'load') {
          this.loadCb = cb
        }
        if (e === 'error') {
          this.errorCb = cb
        }
      }
      readAsArrayBuffer (chunk) {
        this.loadCb({ target: { result: new ArrayBuffer(8) } })
      }
      }
  })

  afterEach(() => {
    global.FileReader = undefined
  })

  it('should return a promise that resolves with the specified chunk', () => {
    return getArrayBuffer('abcde').then(buffer => {
      expect(typeof buffer).toEqual('object')
      expect(buffer.byteLength).toEqual(8)
    })
  })
})
