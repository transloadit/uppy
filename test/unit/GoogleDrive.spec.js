import test from 'tape'
import nock from 'nock'
import Utils from '../../src/core/Utils'
import Google from '../../src/plugins/GoogleDrive'

test('checkAuthentication success', function (t) {
  t.plan(1)

  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: true
    })

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})
  GoogleDrive.checkAuthentication()
    .then((isAuthed) => {
      t.equal(isAuthed, true)
    })
})

test('checkAuthentication fail', function (t) {
  t.plan(1)

  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: false
    })

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})
  GoogleDrive.checkAuthentication()
    .then((isAuthed) => {
      t.equal(isAuthed, false)
    })
})

test('getFile: success', function (t) {
  t.plan(1)

  nock('http://localhost:3020')
    .post('/google/get')
    .reply(201, (uri, requestBody) => {
      return {
        ok: true,
        id: '12345'
      }
    })

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})

  GoogleDrive.getFile('12345')
    .then((result) => {
      t.equal(result.ok, true)
    })
})

test('getFile: fileId not a string', function (t) {
  t.plan(1)

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})
  var result = GoogleDrive.getFile()

  t.equal(result instanceof Error, true)
})

test('getFolder: success', function (t) {
  t.plan(1)

  nock('http://localhost:3020')
  .get('/google/list')
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

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})
  GoogleDrive.getFolder('/')
    .then((res) => {
      const allFolders = Utils.every(res.folders, function (folder) {
        return folder.mimeType === 'application/vnd.google-apps.folder'
      })

      const allFiles = Utils.every(res.files, (file) => {
        return file.mimeType !== 'application/vnd.google-apps.folder'
      })

      t.equal(allFolders && allFiles, true)
    })
})

test('getFolder: fail', function (t) {
  t.plan(1)

  nock('http://localhost:3020')
  .get('/google/list')
  .reply(500, 'Not authenticated')

  var GoogleDrive = new Google(null, {host: 'http://localhost:3020'})
  GoogleDrive.getFolder('/')
    .then((err) => {
      t.equal(err instanceof Error, true)
    })
})
