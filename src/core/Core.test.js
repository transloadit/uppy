const fs = require('fs')
const path = require('path')
const Core = require('./Core')
const utils = require('./Utils')
const Plugin = require('./Plugin')
const AcquirerPlugin1 = require('../../test/mocks/acquirerPlugin1')
const AcquirerPlugin2 = require('../../test/mocks/acquirerPlugin2')
const InvalidPlugin = require('../../test/mocks/invalidPlugin')
const InvalidPluginWithoutId = require('../../test/mocks/invalidPluginWithoutId')
const InvalidPluginWithoutType = require('../../test/mocks/invalidPluginWithoutType')

jest.mock('cuid', () => {
  return () => 'cjd09qwxb000dlql4tp4doz8h'
})

const sampleImage = fs.readFileSync(path.join(__dirname, '../../test/resources/image.jpg'))

describe('src/Core', () => {
  const RealCreateObjectUrl = global.URL.createObjectURL
  beforeEach(() => {
    jest.spyOn(utils, 'findDOMElement').mockImplementation(path => {
      return 'some config...'
    })
    global.URL.createObjectURL = jest.fn().mockReturnValue('newUrl')
  })

  afterEach(() => {
    global.URL.createObjectURL = RealCreateObjectUrl
  })

  it('should expose a class', () => {
    const core = Core()
    expect(core.constructor.name).toEqual('Uppy')
  })

  it('should have a string `id` option that defaults to "uppy"', () => {
    const core = Core()
    expect(core.getID()).toEqual('uppy')

    const core2 = Core({ id: 'profile' })
    expect(core2.getID()).toEqual('profile')
  })

  describe('plugins', () => {
    it('should add a plugin to the plugin stack', () => {
      const core = Core()
      core.use(AcquirerPlugin1)
      expect(Object.keys(core.plugins.acquirer).length).toEqual(1)
    })

    it('should prevent the same plugin from being added more than once', () => {
      const core = Core()
      core.use(AcquirerPlugin1)

      expect(() => {
        core.use(AcquirerPlugin1)
      }).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add an invalid plugin', () => {
      const core = Core()

      expect(() => {
        core.use(InvalidPlugin)
      }).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add a plugin that has no id', () => {
      const core = Core()

      expect(() =>
        core.use(InvalidPluginWithoutId)
      ).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add a plugin that has no type', () => {
      const core = Core()

      expect(() =>
        core.use(InvalidPluginWithoutType)
      ).toThrowErrorMatchingSnapshot()
    })

    it('should return the plugin that matches the specified name', () => {
      const core = new Core()
      expect(core.getPlugin('foo')).toEqual(null)

      core.use(AcquirerPlugin1)
      const plugin = core.getPlugin('TestSelector1')
      expect(plugin.id).toEqual('TestSelector1')
      expect(plugin instanceof Plugin)
    })

    it('should call the specified method on all the plugins', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      core.iteratePlugins(plugin => {
        plugin.run('hello')
      })
      expect(core.plugins.acquirer[0].mocks.run.mock.calls.length).toEqual(1)
      expect(core.plugins.acquirer[0].mocks.run.mock.calls[0]).toEqual([
        'hello'
      ])
      expect(core.plugins.acquirer[1].mocks.run.mock.calls.length).toEqual(1)
      expect(core.plugins.acquirer[1].mocks.run.mock.calls[0]).toEqual([
        'hello'
      ])
    })

    it('should uninstall and the remove the specified plugin', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      expect(Object.keys(core.plugins.acquirer).length).toEqual(2)

      const plugin = core.getPlugin('TestSelector1')
      core.removePlugin(plugin)
      expect(Object.keys(core.plugins.acquirer).length).toEqual(1)
      expect(plugin.mocks.uninstall.mock.calls.length).toEqual(1)
      expect(core.plugins.acquirer[0].mocks.run.mock.calls.length).toEqual(0)
    })
  })

  describe('state', () => {
    it('should update all the plugins with the new state when the updateAll method is called', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      core.updateAll({ foo: 'bar' })
      expect(core.plugins.acquirer[0].mocks.update.mock.calls.length).toEqual(1)
      expect(core.plugins.acquirer[0].mocks.update.mock.calls[0]).toEqual([
        { foo: 'bar' }
      ])
      expect(core.plugins.acquirer[1].mocks.update.mock.calls.length).toEqual(1)
      expect(core.plugins.acquirer[1].mocks.update.mock.calls[0]).toEqual([
        { foo: 'bar' }
      ])
    })

    it('should update the state', () => {
      const core = new Core()
      const stateUpdateEventMock = jest.fn()
      core.on('state-update', stateUpdateEventMock)
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)

      core.setState({ foo: 'bar', bee: 'boo' })
      core.setState({ foo: 'baar' })

      const newState = {
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'baar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      }

      expect(core.getState()).toEqual(newState)

      expect(core.plugins.acquirer[0].mocks.update.mock.calls[1]).toEqual([
        newState
      ])
      expect(core.plugins.acquirer[1].mocks.update.mock.calls[1]).toEqual([
        newState
      ])

      expect(stateUpdateEventMock.mock.calls.length).toEqual(2)
      // current state
      expect(stateUpdateEventMock.mock.calls[1][0]).toEqual({
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'bar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      })
      // new state
      expect(stateUpdateEventMock.mock.calls[1][1]).toEqual({
        bee: 'boo',
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'baar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      })
    })

    it('should get the state', () => {
      const core = new Core()

      core.setState({ foo: 'bar' })

      expect(core.getState()).toEqual({
        capabilities: { resumableUploads: false },
        files: {},
        currentUploads: {},
        foo: 'bar',
        info: { isHidden: true, message: '', type: 'info' },
        meta: {},
        plugins: {},
        totalProgress: 0
      })
    })
  })

  it('should reset when the reset method is called', () => {
    const core = new Core()
    // const corePauseEventMock = jest.fn()
    const coreCancelEventMock = jest.fn()
    const coreStateUpdateEventMock = jest.fn()
    core.on('cancel-all', coreCancelEventMock)
    core.on('state-update', coreStateUpdateEventMock)
    core.setState({ foo: 'bar', totalProgress: 30 })

    core.reset()

    // expect(corePauseEventMock.mock.calls.length).toEqual(1)
    expect(coreCancelEventMock.mock.calls.length).toEqual(1)
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(2)
    expect(coreStateUpdateEventMock.mock.calls[1][1]).toEqual({
      capabilities: { resumableUploads: false },
      files: {},
      currentUploads: {},
      error: null,
      foo: 'bar',
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    })
  })

  it('should clear all uploads on cancelAll()', () => {
    const core = new Core()
    const id = core._createUpload([ 'a', 'b' ])

    expect(core.getState().currentUploads[id]).toBeDefined()

    core.cancelAll()

    expect(core.getState().currentUploads[id]).toBeUndefined()
  })

  it('should close, reset and uninstall when the close method is called', () => {
    const core = new Core()
    core.use(AcquirerPlugin1)

    const coreCancelEventMock = jest.fn()
    const coreStateUpdateEventMock = jest.fn()
    const plugin = core.plugins.acquirer[0]

    core.on('cancel-all', coreCancelEventMock)
    core.on('state-update', coreStateUpdateEventMock)

    core.close()

    // expect(corePauseEventMock.mock.calls.length).toEqual(1)
    expect(coreCancelEventMock.mock.calls.length).toEqual(1)
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(1)
    expect(coreStateUpdateEventMock.mock.calls[0][1]).toEqual({
      capabilities: { resumableUploads: false },
      files: {},
      currentUploads: {},
      error: null,
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    })
    expect(plugin.mocks.uninstall.mock.calls.length).toEqual(1)
    expect(core.plugins[Object.keys(core.plugins)[0]].length).toEqual(0)
  })

  describe('upload hooks', () => {
    it('should add data returned from upload hooks to the .upload() result', () => {
      const core = new Core()
      core.addPreProcessor((fileIDs, uploadID) => {
        core.addResultData(uploadID, { pre: 'ok' })
      })
      core.addPostProcessor((fileIDs, uploadID) => {
        core.addResultData(uploadID, { post: 'ok' })
      })
      core.addUploader((fileIDs, uploadID) => {
        core.addResultData(uploadID, { upload: 'ok' })
      })
      return core.upload().then((result) => {
        expect(result.pre).toBe('ok')
        expect(result.upload).toBe('ok')
        expect(result.post).toBe('ok')
      })
    })
  })

  describe('preprocessors', () => {
    it('should add a preprocessor', () => {
      const core = new Core()
      const preprocessor = function () {}
      core.addPreProcessor(preprocessor)
      expect(core.preProcessors[0]).toEqual(preprocessor)
    })

    it('should remove a preprocessor', () => {
      const core = new Core()
      const preprocessor1 = function () {}
      const preprocessor2 = function () {}
      const preprocessor3 = function () {}
      core.addPreProcessor(preprocessor1)
      core.addPreProcessor(preprocessor2)
      core.addPreProcessor(preprocessor3)
      expect(core.preProcessors.length).toEqual(3)
      core.removePreProcessor(preprocessor2)
      expect(core.preProcessors.length).toEqual(2)
    })

    it('should execute all the preprocessors when uploading a file', () => {
      const core = new Core()
      const preprocessor1 = jest.fn()
      const preprocessor2 = jest.fn()
      core.addPreProcessor(preprocessor1)
      core.addPreProcessor(preprocessor2)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      return core.upload()
        .then(() => {
          const fileId = Object.keys(core.getState().files)[0]
          expect(preprocessor1.mock.calls.length).toEqual(1)

          expect(preprocessor1.mock.calls[0][0].length).toEqual(1)
          expect(preprocessor1.mock.calls[0][0][0]).toEqual(fileId)

          expect(preprocessor2.mock.calls[0][0].length).toEqual(1)
          expect(preprocessor2.mock.calls[0][0][0]).toEqual(fileId)
        })
    })

    it('should update the file progress state when preprocess-progress event is fired', () => {
      const core = new Core()
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false,
        preprocess: { mode: 'determinate', message: 'something', value: 0 }
      })
    })

    it('should update the file progress state when preprocess-complete event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileID = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileID)
      core.emit('preprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      })
      expect(core.getFile(fileID).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })
    })
  })

  describe('postprocessors', () => {
    it('should add a postprocessor', () => {
      const core = new Core()
      const postprocessor = function () {}
      core.addPostProcessor(postprocessor)
      expect(core.postProcessors[0]).toEqual(postprocessor)
    })

    it('should remove a postprocessor', () => {
      const core = new Core()
      const postprocessor1 = function () {}
      const postprocessor2 = function () {}
      const postprocessor3 = function () {}
      core.addPostProcessor(postprocessor1)
      core.addPostProcessor(postprocessor2)
      core.addPostProcessor(postprocessor3)
      expect(core.postProcessors.length).toEqual(3)
      core.removePostProcessor(postprocessor2)
      expect(core.postProcessors.length).toEqual(2)
    })

    it('should execute all the postprocessors when uploading a file', () => {
      const core = new Core()
      const postprocessor1 = jest.fn()
      const postprocessor2 = jest.fn()
      core.addPostProcessor(postprocessor1)
      core.addPostProcessor(postprocessor2)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      return core.upload().then(() => {
        expect(postprocessor1.mock.calls.length).toEqual(1)
        // const lastModifiedTime = new Date()
        // const fileId = 'foojpg' + lastModifiedTime.getTime()
        const fileId = 'uppy-foojpg-image'

        expect(postprocessor1.mock.calls[0][0].length).toEqual(1)
        expect(postprocessor1.mock.calls[0][0][0].substring(0, 17)).toEqual(
          fileId.substring(0, 17)
        )

        expect(postprocessor2.mock.calls[0][0].length).toEqual(1)
        expect(postprocessor2.mock.calls[0][0][0].substring(0, 17)).toEqual(
          fileId.substring(0, 17)
        )
      })
    })

    it('should update the file progress state when postprocess-progress event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('postprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false,
        postprocess: { mode: 'determinate', message: 'something', value: 0 }
      })
    })

    it('should update the file progress state when postprocess-complete event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('postprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })
    })
  })

  describe('uploaders', () => {
    it('should add an uploader', () => {
      const core = new Core()
      const uploader = function () {}
      core.addUploader(uploader)
      expect(core.uploaders[0]).toEqual(uploader)
    })

    it('should remove an uploader', () => {
      const core = new Core()
      const uploader1 = function () {}
      const uploader2 = function () {}
      const uploader3 = function () {}
      core.addUploader(uploader1)
      core.addUploader(uploader2)
      core.addUploader(uploader3)
      expect(core.uploaders.length).toEqual(3)
      core.removeUploader(uploader2)
      expect(core.uploaders.length).toEqual(2)
    })
  })

  describe('adding a file', () => {
    it('should call onBeforeFileAdded if it was specified in the options when initialising the class', () => {
      const onBeforeFileAdded = jest.fn()
      const core = new Core({
        onBeforeFileAdded
      })

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      expect(onBeforeFileAdded.mock.calls.length).toEqual(1)
      expect(onBeforeFileAdded.mock.calls[0][0].name).toEqual('foo.jpg')
      expect(onBeforeFileAdded.mock.calls[0][1]).toEqual({})
    })

    it('should add a file', () => {
      const fileData = new File([sampleImage], { type: 'image/jpeg' })
      const fileAddedEventMock = jest.fn()
      const core = new Core()
      core.on('file-added', fileAddedEventMock)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: fileData
      })

      const fileId = Object.keys(core.getState().files)[0]
      const newFile = {
        extension: 'jpg',
        id: fileId,
        isRemote: false,
        meta: { name: 'foo.jpg', type: 'image/jpeg' },
        name: 'foo.jpg',
        preview: undefined,
        data: fileData,
        progress: {
          bytesTotal: 17175,
          bytesUploaded: 0,
          percentage: 0,
          uploadComplete: false,
          uploadStarted: false
        },
        remote: '',
        size: 17175,
        source: 'jest',
        type: 'image/jpeg'
      }
      expect(core.getFile(fileId)).toEqual(newFile)
      expect(fileAddedEventMock.mock.calls[0][0]).toEqual(newFile)
    })

    it('should not allow a file that does not meet the restrictions', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['image/gif']
        }
      })
      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        })
        throw new Error('File was allowed through')
      } catch (err) {
        expect(err.message).toEqual('You can only upload: image/gif')
      }
    })

    it('should not allow a file if onBeforeFileAdded returned false', () => {
      const core = new Core({
        onBeforeFileAdded: (file, files) => {
          if (file.source === 'jest') {
            return false
          }
        }
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      expect(core.getFiles().length).toEqual(0)
    })
  })

  describe('uploading a file', () => {
    it('should return a { successful, failed } pair containing file objects', () => {
      const core = new Core()
      core.addUploader((fileIDs) => Promise.resolve())

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })

      return expect(core.upload()).resolves.toMatchObject({
        successful: [
          { name: 'foo.jpg' },
          { name: 'bar.jpg' }
        ],
        failed: []
      })
    })

    it('should return files with errors in the { failed } key', () => {
      const core = new Core()
      core.addUploader((fileIDs) => {
        fileIDs.forEach((fileID) => {
          const file = core.getFile(fileID)
          if (/bar/.test(file.name)) {
            core.emit('upload-error', file, new Error('This is bar and I do not like bar'))
          }
        })
        return Promise.resolve()
      })

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })

      return expect(core.upload()).resolves.toMatchObject({
        successful: [
          { name: 'foo.jpg' }
        ],
        failed: [
          { name: 'bar.jpg', error: 'This is bar and I do not like bar' }
        ]
      })
    })

    it('should only upload files that are not already assigned to another upload id', () => {
      const core = new Core()
      core.store.state.currentUploads = {
        upload1: {
          fileIDs: ['uppy-file1jpg-image/jpeg', 'uppy-file2jpg-image/jpeg', 'uppy-file3jpg-image/jpeg']
        },
        upload2: {
          fileIDs: ['uppy-file4jpg-image/jpeg', 'uppy-file5jpg-image/jpeg', 'uppy-file6jpg-image/jpeg']
        }
      }
      core.addUploader((fileIDs) => Promise.resolve())

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'file3', name: 'file3.jpg', type: 'image/jpeg', data: new Uint8Array() })

      return expect(core.upload()).resolves.toMatchSnapshot()
    })

    it('should not upload if onBeforeUpload returned false', () => {
      const core = new Core({
        autoProceed: false,
        onBeforeUpload: (files) => {
          for (var fileId in files) {
            if (files[fileId].name === '123.foo') {
              return false
            }
          }
        }
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      core.addFile({
        source: 'jest',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      core.addFile({
        source: 'jest',
        name: '123.foo',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      return core.upload().catch((err) => {
        expect(err).toMatchObject(new Error('Not starting the upload because onBeforeUpload returned false'))
      })
    })
  })

  describe('removing a file', () => {
    it('should remove the file', () => {
      const fileRemovedEventMock = jest.fn()

      const core = new Core()
      core.on('file-removed', fileRemovedEventMock)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      expect(core.getFiles().length).toEqual(1)
      core.setState({
        totalProgress: 50
      })

      const file = core.getFile(fileId)
      core.removeFile(fileId)

      expect(core.getFiles().length).toEqual(0)
      expect(fileRemovedEventMock.mock.calls[0][0]).toEqual(file)
      expect(core.getState().totalProgress).toEqual(0)
    })
  })

  describe('restoring a file', () => {
    xit('should restore a file', () => {})

    xit("should fail to restore a file if it doesn't exist", () => {})
  })

  describe('get a file', () => {
    it('should get the specified file', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      expect(core.getFile(fileId).name).toEqual('foo.jpg')

      expect(core.getFile('non existant file')).toEqual(undefined)
    })
  })

  describe('getFiles', () => {
    it('should return an empty array if there are no files', () => {
      const core = new Core()

      expect(core.getFiles()).toEqual([])
    })

    it('should return all files as an array', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      core.addFile({
        source: 'jest',
        name: 'empty.dat',
        type: 'application/octet-stream',
        data: new File([Buffer.alloc(1000)], { type: 'application/octet-stream' })
      })

      expect(core.getFiles()).toHaveLength(2)
      expect(core.getFiles().map((file) => file.name).sort()).toEqual(['empty.dat', 'foo.jpg'])
    })
  })

  describe('meta data', () => {
    it('should set meta data by calling setMeta', () => {
      const core = new Core({
        meta: { foo2: 'bar2' }
      })
      core.setMeta({ foo: 'bar', bur: 'mur' })
      core.setMeta({ boo: 'moo', bur: 'fur' })
      expect(core.getState().meta).toEqual({
        foo: 'bar',
        foo2: 'bar2',
        boo: 'moo',
        bur: 'fur'
      })
    })

    it('should update meta data for a file by calling updateMeta', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      core.setFileMeta(fileId, { foo: 'bar', bur: 'mur' })
      core.setFileMeta(fileId, { boo: 'moo', bur: 'fur' })
      expect(core.getFile(fileId).meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo: 'bar',
        bur: 'fur',
        boo: 'moo'
      })
    })

    it('should merge meta data when add file', () => {
      const core = new Core({
        meta: { foo2: 'bar2' }
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        meta: {
          resize: 5000
        },
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      const fileId = Object.keys(core.getState().files)[0]
      expect(core.getFile(fileId).meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo2: 'bar2',
        resize: 5000
      })
    })
  })

  describe('progress', () => {
    it('should calculate the progress of a file upload', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core._calculateProgress(file, {
        bytesUploaded: 12345,
        bytesTotal: 17175
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 71,
        bytesUploaded: 12345,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })

      core._calculateProgress(file, {
        bytesUploaded: 17175,
        bytesTotal: 17175
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 100,
        bytesUploaded: 17175,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })
    })

    it('should calculate the total progress of all file uploads', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const [file1, file2] = core.getFiles()
      core.setFileState(file1.id, { progress: Object.assign({}, file1.progress, { uploadStarted: new Date() }) })
      core.setFileState(file2.id, { progress: Object.assign({}, file2.progress, { uploadStarted: new Date() }) })

      core._calculateProgress(core.getFile(file1.id), {
        bytesUploaded: 12345,
        bytesTotal: 17175
      })

      core._calculateProgress(core.getFile(file2.id), {
        bytesUploaded: 10201,
        bytesTotal: 17175
      })

      core._calculateTotalProgress()
      expect(core.getState().totalProgress).toEqual(65)
    })

    it('should reset the progress', () => {
      const resetProgressEvent = jest.fn()
      const core = new Core()
      core.on('reset-progress', resetProgressEvent)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      const [file1, file2] = core.getFiles()
      core.setFileState(file1.id, { progress: Object.assign({}, file1.progress, { uploadStarted: new Date() }) })
      core.setFileState(file2.id, { progress: Object.assign({}, file2.progress, { uploadStarted: new Date() }) })

      core._calculateProgress(core.getFile(file1.id), {
        bytesUploaded: 12345,
        bytesTotal: 17175
      })

      core._calculateProgress(core.getFile(file2.id), {
        bytesUploaded: 10201,
        bytesTotal: 17175
      })

      core._calculateTotalProgress()

      expect(core.getState().totalProgress).toEqual(65)

      core.resetProgress()

      expect(core.getFile(file1.id).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })
      expect(core.getFile(file2.id).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: false
      })
      expect(core.getState().totalProgress).toEqual(0)
      expect(resetProgressEvent.mock.calls.length).toEqual(1)
    })
  })

  describe('checkRestrictions', () => {
    it('should enforce the maxNumberOfFiles rule', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          maxNumberOfFiles: 1
        }
      })

      // add 2 files
      core.addFile({
        source: 'jest',
        name: 'foo1.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })
      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload 1 file'))
        expect(core.getState().info.message).toEqual('You can only upload 1 file')
      }
    })

    xit('should enforce the minNumberOfFiles rule', () => {})

    it('should enforce the allowedFileTypes rule', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          allowedFileTypes: ['image/gif', 'image/png']
        }
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: image/gif, image/png'))
        expect(core.getState().info.message).toEqual('You can only upload: image/gif, image/png')
      }
    })

    it('should enforce the allowedFileTypes rule with file extensions', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          allowedFileTypes: ['.gif', '.jpg', '.jpeg']
        }
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.png',
          type: '',
          data: new File([sampleImage], { type: 'image/jpeg' })
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: .gif, .jpg, .jpeg'))
        expect(core.getState().info.message).toEqual('You can only upload: .gif, .jpg, .jpeg')
      }
    })

    it('should enforce the maxFileSize rule', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          maxFileSize: 1234
        }
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' })
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('This file exceeds maximum allowed size of 1.2 KB'))
        expect(core.getState().info.message).toEqual('This file exceeds maximum allowed size of 1.2 KB')
      }
    })
  })

  describe('actions', () => {
    it('should update the state when receiving the error event', () => {
      const core = new Core()
      core.emit('error', new Error('foooooo'))
      expect(core.getState().error).toEqual('foooooo')
    })

    it('should update the state when receiving the upload-error event', () => {
      const core = new Core()
      core.setState({
        files: {
          fileId: {
            id: 'fileId',
            name: 'filename'
          }
        }
      })
      core.emit('upload-error', core.getFile('fileId'), new Error('this is the error'))
      expect(core.getState().info).toEqual({'message': 'Failed to upload filename', 'details': 'this is the error', 'isHidden': false, 'type': 'error'})
    })

    it('should reset the error state when receiving the upload event', () => {
      const core = new Core()
      core.emit('error', { foo: 'bar' })
      core.emit('upload')
      expect(core.getState().error).toEqual(null)
    })
  })

  describe('updateOnlineStatus', () => {
    const RealNavigatorOnline = global.window.navigator.onLine

    function mockNavigatorOnline (status) {
      Object.defineProperty(
        global.window.navigator,
        'onLine',
        {
          value: status,
          writable: true
        }
      )
    }

    afterEach(() => {
      global.window.navigator.onLine = RealNavigatorOnline
    })

    it('should emit the correct event based on whether there is a network connection', () => {
      const onlineEventMock = jest.fn()
      const offlineEventMock = jest.fn()
      const backOnlineEventMock = jest.fn()
      const core = new Core()
      core.on('is-offline', offlineEventMock)
      core.on('is-online', onlineEventMock)
      core.on('back-online', backOnlineEventMock)

      mockNavigatorOnline(true)
      core.updateOnlineStatus()
      expect(onlineEventMock.mock.calls.length).toEqual(1)
      expect(offlineEventMock.mock.calls.length).toEqual(0)
      expect(backOnlineEventMock.mock.calls.length).toEqual(0)

      mockNavigatorOnline(false)
      core.updateOnlineStatus()
      expect(onlineEventMock.mock.calls.length).toEqual(1)
      expect(offlineEventMock.mock.calls.length).toEqual(1)
      expect(backOnlineEventMock.mock.calls.length).toEqual(0)

      mockNavigatorOnline(true)
      core.updateOnlineStatus()
      expect(onlineEventMock.mock.calls.length).toEqual(2)
      expect(offlineEventMock.mock.calls.length).toEqual(1)
      expect(backOnlineEventMock.mock.calls.length).toEqual(1)
    })
  })

  describe('info', () => {
    it('should set a string based message to be displayed infinitely', () => {
      const infoVisibleEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)

      core.info('This is the message', 'info', 0)
      expect(core.getState().info).toEqual({
        isHidden: false,
        type: 'info',
        message: 'This is the message',
        details: null
      })
      expect(infoVisibleEvent.mock.calls.length).toEqual(1)
      expect(typeof core.infoTimeoutID).toEqual('undefined')
    })

    it('should set a object based message to be displayed infinitely', () => {
      const infoVisibleEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)

      core.info({
        message: 'This is the message',
        details: {
          foo: 'bar'
        }
      }, 'warning', 0)
      expect(core.getState().info).toEqual({
        isHidden: false,
        type: 'warning',
        message: 'This is the message',
        details: {
          foo: 'bar'
        }
      })
      expect(infoVisibleEvent.mock.calls.length).toEqual(1)
      expect(typeof core.infoTimeoutID).toEqual('undefined')
    })

    it('should set an info message to be displayed for a period of time before hiding', (done) => {
      const infoVisibleEvent = jest.fn()
      const infoHiddenEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 100)
      expect(typeof core.infoTimeoutID).toEqual('number')
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      setTimeout(() => {
        expect(infoHiddenEvent.mock.calls.length).toEqual(1)
        expect(core.getState().info).toEqual({
          isHidden: true,
          type: 'info',
          message: 'This is the message',
          details: null
        })
        done()
      }, 110)
    })

    it('should hide an info message', () => {
      const infoVisibleEvent = jest.fn()
      const infoHiddenEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 0)
      expect(typeof core.infoTimeoutID).toEqual('undefined')
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      core.hideInfo()
      expect(infoHiddenEvent.mock.calls.length).toEqual(1)
      expect(core.getState().info).toEqual({
        isHidden: true,
        type: 'info',
        message: 'This is the message',
        details: null
      })
    })
  })

  describe('createUpload', () => {
    it('should assign the specified files to a new upload', () => {
      const core = new Core()
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' })
      })

      core._createUpload(Object.keys(core.getState().files))
      const uploadId = Object.keys(core.getState().currentUploads)[0]
      const currentUploadsState = {}
      currentUploadsState[uploadId] = {
        fileIDs: Object.keys(core.getState().files),
        step: 0,
        result: {}
      }
      expect(core.getState().currentUploads).toEqual(currentUploadsState)
    })
  })

  describe('i18n', () => {
    it('merges in custom locale strings', () => {
      const core = new Core({
        locale: {
          strings: {
            test: 'beep boop'
          }
        }
      })

      expect(core.i18n('exceedsSize')).toBe('This file exceeds maximum allowed size of')
      expect(core.i18n('test')).toBe('beep boop')
    })
  })

  describe('default restrictions', () => {
    it('should be merged with supplied restrictions', () => {
      const core = new Core({
        restrictions: {
          maxNumberOfFiles: 3
        }
      })

      expect(core.opts.restrictions.maxNumberOfFiles).toBe(3)
      expect(core.opts.restrictions.minNumberOfFiles).toBe(null)
    })
  })
})
