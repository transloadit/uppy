import Core from './Core'
import utils from './Utils'
import Plugin from './Plugin'
import AcquirerPlugin1 from '../../test/mocks/acquirerPlugin1'
import AcquirerPlugin2 from '../../test/mocks/acquirerPlugin2'
import InvalidPlugin from '../../test/mocks/invalidPlugin'
import InvalidPluginWithoutId from '../../test/mocks/invalidPluginWithoutId'
import InvalidPluginWithoutType from '../../test/mocks/invalidPluginWithoutType'

jest.mock('cuid', () => {
  return () => 'cjd09qwxb000dlql4tp4doz8h'
})

const sampleImageDataURI =
  'data:image/jpeg;base64,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'

describe('src/Core', () => {
  const RealCreateObjectUrl = global.URL.createObjectURL
  beforeEach(() => {
    jest.spyOn(utils, 'findDOMElement').mockImplementation(path => {
      return 'some config...'
    })
    jest.spyOn(utils, 'createThumbnail').mockImplementation(path => {
      return Promise.resolve(sampleImageDataURI)
    })
    utils.createThumbnail.mockClear()

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
      expect(core.getPlugin('foo')).toEqual(false)

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

      expect(core.state).toEqual(newState)

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
      foo: 'bar',
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    })
  })

  it('should close, reset and uninstall when the close method is called', () => {
    const core = new Core()
    core.use(AcquirerPlugin1)

    // const corePauseEventMock = jest.fn()
    const coreCancelEventMock = jest.fn()
    const coreStateUpdateEventMock = jest.fn()
    // core.on('pause-all', corePauseEventMock)
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
      info: { isHidden: true, message: '', type: 'info' },
      meta: {},
      plugins: {},
      totalProgress: 0
    })
    expect(core.plugins.acquirer[0].mocks.uninstall.mock.calls.length).toEqual(
      1
    )
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
      core.run()
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

      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => core.upload())
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          expect(preprocessor1.mock.calls.length).toEqual(1)

          expect(preprocessor1.mock.calls[0][0].length).toEqual(1)
          expect(preprocessor1.mock.calls[0][0][0]).toEqual(fileId)

          expect(preprocessor2.mock.calls[0][0].length).toEqual(1)
          expect(preprocessor2.mock.calls[0][0][0]).toEqual(fileId)
        })
    })

    it('should update the file progress state when preprocess-progress event is fired', () => {
      const core = new Core()
      core.run()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.emit('preprocess-progress', fileId, {
            mode: 'determinate',
            message: 'something',
            value: 0
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false,
            preprocess: { mode: 'determinate', message: 'something', value: 0 }
          })
        })
    })

    it('should update the file progress state when preprocess-complete event is fired', () => {
      const core = new Core()
      core.run()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.emit('preprocess-complete', fileId, {
            mode: 'determinate',
            message: 'something',
            value: 0
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })
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

      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => core.upload())
        .then(() => {
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
      core.run()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.emit('postprocess-progress', fileId, {
            mode: 'determinate',
            message: 'something',
            value: 0
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false,
            postprocess: { mode: 'determinate', message: 'something', value: 0 }
          })
        })
    })

    it('should update the file progress state when postprocess-complete event is fired', () => {
      const core = new Core()
      core.run()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.emit('postprocess-complete', fileId, {
            mode: 'determinate',
            message: 'something',
            value: 0
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })
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

  describe('removers', () => {
    it('should add a remover', () => {
      const core = new Core({
        removeAfterUpload: true
      })
      const remover = function () {}
      core.addUploader(() => null, remover)
      expect(core.removers.length).toEqual(1)
      expect(core.removers[0]).toEqual(remover)
    })

    it('should not add a remover when removeAfterUpload does not set', () => {
      const core = new Core()
      const remover = function () {}
      core.addUploader(() => null, remover)
      expect(core.removers.length).toEqual(0)
    })

    it('should remove a remover', () => {
      const core = new Core({
        removeAfterUpload: true
      })
      const remover1 = function () {}
      const remover2 = function () {}
      const remover3 = function () {}
      core.addUploader(() => null, remover1)
      core.addUploader(() => null, remover2)
      core.addUploader(() => null, remover3)
      expect(core.removers.length).toEqual(3)
      core.removeUploader(null, remover2)
      expect(core.removers.length).toEqual(2)
    })
  })

  describe('adding a file', () => {
    it('should call onBeforeFileAdded if it was specified in the options when initailising the class', () => {
      const onBeforeFileAdded = jest.fn(value => {
        return Promise.resolve()
      })
      const core = new Core({
        onBeforeFileAdded
      })
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          expect(onBeforeFileAdded.mock.calls.length).toEqual(1)
          expect(onBeforeFileAdded.mock.calls[0][0].name).toEqual('foo.jpg')
          expect(onBeforeFileAdded.mock.calls[0][1]).toEqual({})
        })
    })

    it('should add a file', () => {
      const fileData = utils.dataURItoFile(sampleImageDataURI, {})
      const fileAddedEventMock = jest.fn()
      const core = new Core()
      core.run()
      core.on('file-added', fileAddedEventMock)
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: fileData
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
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
          expect(core.state.files[fileId]).toEqual(newFile)
          expect(fileAddedEventMock.mock.calls[0][0]).toEqual(newFile)
        })
    })

    it('should not allow a file that does not meet the restrictions', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['image/gif']
        }
      })
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          throw new Error('File was allowed through')
        })
        .catch(e => {
          expect(e.message).toEqual('File not allowed')
        })
    })

    it('should work with restriction errors that are not Error class instances', () => {
      const core = new Core({
        onBeforeFileAdded () {
          return Promise.reject('a plain string') // eslint-disable-line prefer-promise-reject-errors
        }
      })
      return expect(core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: null
      })).rejects.toMatchObject(new Error('onBeforeFileAdded: a plain string'))
    })
  })

  describe('uploading a file', () => {
    it('should return a { successful, failed } pair containing file objects', () => {
      const core = new Core().run()
      core.addUploader((fileIDs) => Promise.resolve())
      return Promise.all([
        core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() }),
        core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })
      ]).then(() => {
        return expect(core.upload()).resolves.toMatchObject({
          successful: [
            { name: 'foo.jpg' },
            { name: 'bar.jpg' }
          ],
          failed: []
        })
      })
    })

    it('should return files with errors in the { failed } key', () => {
      const core = new Core().run()
      core.addUploader((fileIDs) => {
        fileIDs.forEach((fileID) => {
          if (/bar/.test(core.getFile(fileID).name)) {
            core.emit('upload-error', fileID, new Error('This is bar and I do not like bar'))
          }
        })
        return Promise.resolve()
      })

      return Promise.all([
        core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() }),
        core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })
      ]).then(() => {
        return expect(core.upload()).resolves.toMatchObject({
          successful: [
            { name: 'foo.jpg' }
          ],
          failed: [
            { name: 'bar.jpg', error: 'This is bar and I do not like bar' }
          ]
        })
      })
    })

    it('should only upload files that are not already assigned to another upload id', () => {
      const core = new Core().run()
      core.store.state.currentUploads = {
        upload1: {
          fileIDs: ['uppy-file1jpg-image/jpeg', 'uppy-file2jpg-image/jpeg', 'uppy-file3jpg-image/jpeg']
        },
        upload2: {
          fileIDs: ['uppy-file4jpg-image/jpeg', 'uppy-file5jpg-image/jpeg', 'uppy-file6jpg-image/jpeg']
        }
      }
      core.addUploader((fileIDs) => Promise.resolve())
      return Promise.all([
        core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() }),
        core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() }),
        core.addFile({ source: 'file3', name: 'file3.jpg', type: 'image/jpeg', data: new Uint8Array() })
      ]).then(() => {
        return core.upload()
      }).then((result) => {
        expect(result).toMatchSnapshot()
      })
    })
  })

  describe('removing a file', () => {
    it('should remove the file', () => {
      const fileRemovedEventMock = jest.fn()

      const core = new Core()
      core.on('file-removed', fileRemovedEventMock)
      core.run()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          expect(Object.keys(core.state.files).length).toEqual(1)
          core.setState({
            totalProgress: 50
          })

          core.removeFile(fileId)

          expect(Object.keys(core.state.files).length).toEqual(0)
          expect(fileRemovedEventMock.mock.calls[0][0]).toEqual(fileId)
          expect(core.state.totalProgress).toEqual(0)
        })
    })

    it('should call removers', () => {
      const removerMock = jest.fn()

      const core = new Core({
        removeAfterUpload: true
      })
      core.addUploader(() => null, removerMock)
      core.run()

      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.setState({
            totalProgress: 100
          })

          core.removeFile(fileId)

          expect(removerMock.mock.calls.length).toEqual(1)
          expect(removerMock.mock.calls[0].length).toEqual(1)
          expect(removerMock.mock.calls[0][0].length).toEqual(1)
          expect(removerMock.mock.calls[0][0][0]).toEqual(fileId)
        })
    })
  })

  describe('restoring a file', () => {
    xit('should restore a file', () => {})

    xit("should fail to restore a file if it doesn't exist", () => {})
  })

  describe('get a file', () => {
    it('should get the specified file', () => {
      const core = new Core()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          expect(core.getFile(fileId).name).toEqual('foo.jpg')

          expect(core.getFile('non existant file')).toEqual(undefined)
        })
    })
  })

  describe('meta data', () => {
    it('should set meta data by calling setMeta', () => {
      const core = new Core({
        meta: { foo2: 'bar2' }
      })
      core.setMeta({ foo: 'bar', bur: 'mur' })
      core.setMeta({ boo: 'moo', bur: 'fur' })
      expect(core.state.meta).toEqual({
        foo: 'bar',
        foo2: 'bar2',
        boo: 'moo',
        bur: 'fur'
      })
    })

    it('should update meta data for a file by calling updateMeta', () => {
      const core = new Core()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core.setFileMeta(fileId, { foo: 'bar', bur: 'mur' })
          core.setFileMeta(fileId, { boo: 'moo', bur: 'fur' })
          expect(core.state.files[fileId].meta).toEqual({
            name: 'foo.jpg',
            type: 'image/jpeg',
            foo: 'bar',
            bur: 'fur',
            boo: 'moo'
          })
        })
    })
  })

  describe('progress', () => {
    it('should calculate the progress of a file upload', () => {
      const core = new Core()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          const fileId = Object.keys(core.state.files)[0]
          core._calculateProgress({
            id: fileId,
            bytesUploaded: 12345,
            bytesTotal: 17175
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 71,
            bytesUploaded: 12345,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })

          core._calculateProgress({
            id: fileId,
            bytesUploaded: 17175,
            bytesTotal: 17175
          })
          expect(core.state.files[fileId].progress).toEqual({
            percentage: 100,
            bytesUploaded: 17175,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })
        })
    })

    it('should calculate the total progress of all file uploads', () => {
      const core = new Core()
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          return core
            .addFile({
              source: 'jest',
              name: 'foo2.jpg',
              type: 'image/jpeg',
              data: utils.dataURItoFile(sampleImageDataURI, {})
            })
        }).then(() => {
          const fileId1 = Object.keys(core.state.files)[0]
          const fileId2 = Object.keys(core.state.files)[1]
          core.state.files[fileId1].progress.uploadStarted = new Date()
          core.state.files[fileId2].progress.uploadStarted = new Date()

          core._calculateProgress({
            id: fileId1,
            bytesUploaded: 12345,
            bytesTotal: 17175
          })

          core._calculateProgress({
            id: fileId2,
            bytesUploaded: 10201,
            bytesTotal: 17175
          })

          core._calculateTotalProgress()
          expect(core.state.totalProgress).toEqual(65)
        })
    })

    it('should reset the progress', () => {
      const resetProgressEvent = jest.fn()
      const core = new Core()
      core.run()
      core.on('reset-progress', resetProgressEvent)
      return core
        .addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: utils.dataURItoFile(sampleImageDataURI, {})
        })
        .then(() => {
          return core
            .addFile({
              source: 'jest',
              name: 'foo2.jpg',
              type: 'image/jpeg',
              data: utils.dataURItoFile(sampleImageDataURI, {})
            })
        }).then(() => {
          const fileId1 = Object.keys(core.state.files)[0]
          const fileId2 = Object.keys(core.state.files)[1]
          core.state.files[fileId1].progress.uploadStarted = new Date()
          core.state.files[fileId2].progress.uploadStarted = new Date()

          core._calculateProgress({
            id: fileId1,
            bytesUploaded: 12345,
            bytesTotal: 17175
          })

          core._calculateProgress({
            id: fileId2,
            bytesUploaded: 10201,
            bytesTotal: 17175
          })

          core._calculateTotalProgress()

          expect(core.state.totalProgress).toEqual(65)

          core.resetProgress()

          expect(core.state.files[fileId1].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })
          expect(core.state.files[fileId2].progress).toEqual({
            percentage: 0,
            bytesUploaded: 0,
            bytesTotal: 17175,
            uploadComplete: false,
            uploadStarted: false
          })
          expect(core.state.totalProgress).toEqual(0)
          expect(resetProgressEvent.mock.calls.length).toEqual(1)
        })
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
        data: utils.dataURItoFile(sampleImageDataURI, {})
      })
      return expect(core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: utils.dataURItoFile(sampleImageDataURI, {})
      })).rejects.toMatchObject(new Error('File not allowed')).then(() => {
        expect(core.state.info.message).toEqual('You can only upload 1 file')
      })
    })

    xit('should enforce the minNumberOfFiles rule', () => {})

    it('should enfore the allowedFileTypes rule', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          allowedFileTypes: ['image/gif', 'image/png']
        }
      })

      return expect(core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: utils.dataURItoFile(sampleImageDataURI, {})
      })).rejects.toMatchObject(new Error('File not allowed')).then(() => {
        expect(core.state.info.message).toEqual('You can only upload: image/gif, image/png')
      })
    })

    it('should enforce the maxFileSize rule', () => {
      const core = new Core({
        autoProceed: false,
        restrictions: {
          maxFileSize: 1234
        }
      })

      return expect(core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: utils.dataURItoFile(sampleImageDataURI, {})
      })).rejects.toMatchObject(new Error('File not allowed')).then(() => {
        expect(core.state.info.message).toEqual('This file exceeds maximum allowed size of 1.2 KB')
      })
    })
  })

  describe('actions', () => {
    it('should update the state when receiving the error event', () => {
      const core = new Core()
      core.run()
      core.emit('error', new Error('foooooo'))
      expect(core.state.error).toEqual('foooooo')
    })

    it('should update the state when receiving the upload-error event', () => {
      const core = new Core()
      core.run()
      core.state.files['fileId'] = {
        name: 'filename'
      }
      core.emit('upload-error', 'fileId', new Error('this is the error'))
      expect(core.state.info).toEqual({'message': 'Failed to upload filename', 'details': 'this is the error', 'isHidden': false, 'type': 'error'})
    })

    it('should reset the error state when receiving the upload event', () => {
      const core = new Core()
      core.run()
      core.emit('error', { foo: 'bar' })
      core.emit('upload')
      expect(core.state.error).toEqual(null)
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
      core.run()
      core.on('info-visible', infoVisibleEvent)

      core.info('This is the message', 'info', 0)
      expect(core.state.info).toEqual({
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
      core.run()
      core.on('info-visible', infoVisibleEvent)

      core.info({
        message: 'This is the message',
        details: {
          foo: 'bar'
        }
      }, 'warning', 0)
      expect(core.state.info).toEqual({
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
      core.run()
      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 100)
      expect(typeof core.infoTimeoutID).toEqual('number')
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      setTimeout(() => {
        expect(infoHiddenEvent.mock.calls.length).toEqual(1)
        expect(core.state.info).toEqual({
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
      core.run()
      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 0)
      expect(typeof core.infoTimeoutID).toEqual('undefined')
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      core.hideInfo()
      expect(infoHiddenEvent.mock.calls.length).toEqual(1)
      expect(core.state.info).toEqual({
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
      core.run()
      return core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: utils.dataURItoFile(sampleImageDataURI, {})
      }).then(() => {
        core._createUpload(Object.keys(core.state.files))
        const uploadId = Object.keys(core.state.currentUploads)[0]
        const currentUploadsState = {}
        currentUploadsState[uploadId] = {
          fileIDs: Object.keys(core.state.files),
          step: 0,
          result: {}
        }
        expect(core.state.currentUploads).toEqual(currentUploadsState)
      })
    })
  })
})
