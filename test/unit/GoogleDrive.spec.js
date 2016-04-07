import test from 'tape'
import nock from 'nock'
import Google from '../../src/plugins/GoogleDrive'

test('checkAuthentication success', function (t) {
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: true
    })
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: true
    })

  var GoogleDrive = new Google()
  GoogleDrive.checkAuthentication()
    .then((isAuthed) => t.equal(isAuthed, true))

  t.end()
})

test('checkAuthentication fail', function (t) {
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: false
    })
  nock('http://localhost:3020')
    .get('/google/authorize')
    .reply(200, {
      isAuthenticated: false
    })

  var GoogleDrive = new Google()
  GoogleDrive.checkAuthentication()
    .then((isAuthed) => t.equal(isAuthed, false))

  t.end()
})

test('getFile: success', function (t) {
  nock('http://localhost:3020')
    .post('/google/get')
    .reply(201, (uri, requestBody) => {
      return {
        ok: true,
        id: '12345'
      }
    })

  var GoogleDrive = new Google()

  GoogleDrive.getFile('12345')
    .then((result) => {
      t.equal(result.ok, true)
    })

  t.end()
})

test('getFile: fileId not a string', function (t) {
  var GoogleDrive = new Google()
  var result = GoogleDrive.getFile()

  t.equal(result instanceof Error, true)

  t.end()
})

test('getFolder: success', function (t) {
  t.end()
})

test('getFolder: fail', function (t) {
  t.end()
})
