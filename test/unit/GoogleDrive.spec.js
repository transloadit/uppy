import test from 'tape'
import nock from 'nock'
import Core from '../../src/core/Core'
import Utils from '../../src/core/Utils'
import Google from '../../src/plugins/GoogleDrive'

var defaultCore = {
  state: {
    googleDrive: {
      authenticated: false,
      files: [],
      folders: [],
      directory: 'root'
    }
  }
}

test('checkAuthentication success', function (t) {
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: true
    })

  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  GoogleDrive.checkAuthentication()
    .then((isAuthed) => {
      t.equal(isAuthed, true)
      t.end()
    })
})

test('checkAuthentication fail', function (t) {
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: false
    })

  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  GoogleDrive.checkAuthentication()
    .then((isAuthed) => {
      t.equal(isAuthed, false)
      t.end()
    })
})

test('getFile: success', function (t) {
  nock('http://localhost:3020')
    .get('/google/get?fileId=12345')
    .reply(201, {
      ok: true,
      id: '12345'
    })

  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  GoogleDrive.getFile('12345')
    .then((result) => {
      t.equal(result.ok, true)
      t.end()
    })
})

test('getFile: fileId not a string', function (t) {
  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  var result = GoogleDrive.getFile()

  t.equal(result instanceof Error, true)

  t.end()
})

test('getFolder: success', function (t) {
  nock('http://localhost:3020')
  .get('/google/list?dir=root')
  .reply(200, {
    items: [{
      mimeType: 'application/vnd.google-apps.folder'
    }, {
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, {
      mimeType: 'application/vnd.google-apps.spreadsheet'
    }, {
      mimeType: 'application/vnd.google-apps.folder'
    }]
  })

  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  GoogleDrive.getFolder('root')
    .then((res) => {
      const allFolders = Utils.every(res.folders, function (folder) {
        return folder.mimeType === 'application/vnd.google-apps.folder'
      })

      const allFiles = Utils.every(res.files, (file) => {
        return file.mimeType !== 'application/vnd.google-apps.folder'
      })

      t.equal(allFolders && allFiles, true)
      t.end()
    })
})

test('getFolder: fail', function (t) {
  nock('http://localhost:3020')
  .get('/google/list')
  .reply(500, 'Not authenticated')

  var core = new Core()

  var GoogleDrive = new Google(core, {host: 'http://localhost:3020'})

  GoogleDrive.getFolder('/')
    .then((err) => {
      t.equal(err instanceof Error, true)
      t.end()
    })
})
