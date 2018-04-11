const fs = require('fs')
const path = require('path')
const DUMM_FILE = path.join(__dirname, 'fixtures/image.jpg')

/**
 * an example of a custom provider module. It implements uppy-server's Provider interface
 */
class MyCustomProvider {
  constructor (options) {
    this.authProvider = MyCustomProvider.authProvider
  }

  static get authProvider () {
    return 'mycustomprovider'
  }

  list (options, done) {
    const response = {
      body: {
        entries: [
          { name: 'file1.jpg' },
          { name: 'file2.jpg' },
          {name: 'file3.jpg'}
        ]
      }
    }
    return done(null, response, response.body)
  }

  download ({ id, token }, onData) {
    return fs.readFile(DUMM_FILE, (err, data) => {
      if (err) console.error(err)
      onData(data)
    })
  }

  size ({ id, token }, done) {
    return done(fs.statSync(DUMM_FILE).size)
  }
}

module.exports = MyCustomProvider
