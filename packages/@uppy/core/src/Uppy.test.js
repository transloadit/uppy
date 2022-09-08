/* eslint no-console: "off", no-restricted-syntax: "off" */
import { afterEach, beforeEach, describe, expect, it, jest, xit } from '@jest/globals'

import assert from 'node:assert'
import fs from 'node:fs'
import prettierBytes from '@transloadit/prettier-bytes'
import Core from '../lib/index.js'
import UIPlugin from '../lib/UIPlugin.js'
import AcquirerPlugin1 from './mocks/acquirerPlugin1.js'
import AcquirerPlugin2 from './mocks/acquirerPlugin2.js'
import InvalidPlugin from './mocks/invalidPlugin.js'
import InvalidPluginWithoutId from './mocks/invalidPluginWithoutId.js'
import InvalidPluginWithoutType from './mocks/invalidPluginWithoutType.js'
import DeepFrozenStore from '../../../../e2e/cypress/fixtures/DeepFrozenStore.mjs'

const sampleImage = fs.readFileSync(new URL('../../../../e2e/cypress/fixtures/images/image.jpg', import.meta.url))

describe('src/Core', () => {
  const RealCreateObjectUrl = globalThis.URL.createObjectURL
  beforeEach(() => {
    globalThis.URL.createObjectURL = jest.fn().mockReturnValue('newUrl')
  })

  afterEach(() => {
    globalThis.URL.createObjectURL = RealCreateObjectUrl
  })

  it('should expose a class', () => {
    const core = new Core()
    expect(core.constructor.name).toEqual('Uppy')
  })

  it('should have a string `id` option that defaults to "uppy"', () => {
    const core = new Core()
    expect(core.getID()).toEqual('uppy')

    const core2 = new Core({ id: 'profile' })
    expect(core2.getID()).toEqual('profile')
  })

  describe('plugins', () => {
    it('should add a plugin to the plugin stack', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      expect(Object.keys(core[Symbol.for('uppy test: getPlugins')]('acquirer')).length).toEqual(1)
    })

    it('should prevent the same plugin from being added more than once', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)

      expect(() => {
        core.use(AcquirerPlugin1)
      }).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add an invalid plugin', () => {
      const core = new Core()

      expect(() => {
        core.use(InvalidPlugin)
      }).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add a plugin that has no id', () => {
      const core = new Core()

      expect(() => core.use(InvalidPluginWithoutId)).toThrowErrorMatchingSnapshot()
    })

    it('should not be able to add a plugin that has no type', () => {
      const core = new Core()

      expect(() => core.use(InvalidPluginWithoutType)).toThrowErrorMatchingSnapshot()
    })

    it('should return the plugin that matches the specified name', () => {
      const core = new Core()
      expect(core.getPlugin('foo')).toEqual(undefined)

      core.use(AcquirerPlugin1)
      const plugin = core.getPlugin('TestSelector1')
      expect(plugin.id).toEqual('TestSelector1')
      expect(plugin instanceof UIPlugin)
    })

    it('should call the specified method on all the plugins', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      core.iteratePlugins(plugin => {
        plugin.run('hello')
      })
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.run.mock.calls.length).toEqual(1)
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.run.mock.calls[0]).toEqual([
        'hello',
      ])
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[1].mocks.run.mock.calls.length).toEqual(1)
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[1].mocks.run.mock.calls[0]).toEqual([
        'hello',
      ])
    })

    it('should uninstall and the remove the specified plugin', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      expect(Object.keys(core[Symbol.for('uppy test: getPlugins')]('acquirer')).length).toEqual(2)

      const plugin = core.getPlugin('TestSelector1')
      core.removePlugin(plugin)
      expect(Object.keys(core[Symbol.for('uppy test: getPlugins')]('acquirer')).length).toEqual(1)
      expect(plugin.mocks.uninstall.mock.calls.length).toEqual(1)
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.run.mock.calls.length).toEqual(0)
    })
  })

  describe('state', () => {
    it('should update all the plugins with the new state when the updateAll method is called', () => {
      const core = new Core()
      core.use(AcquirerPlugin1)
      core.use(AcquirerPlugin2)
      core.updateAll({ foo: 'bar' })
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.update.mock.calls.length).toEqual(1)
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.update.mock.calls[0]).toEqual([
        { foo: 'bar' },
      ])
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[1].mocks.update.mock.calls.length).toEqual(1)
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[1].mocks.update.mock.calls[0]).toEqual([
        { foo: 'bar' },
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
        capabilities: { individualCancellation: true, uploadProgress: true, resumableUploads: false },
        files: {},
        currentUploads: {},
        allowNewUpload: true,
        foo: 'baar',
        info: [],
        meta: {},
        plugins: {},
        totalProgress: 0,
        recoveredState: null,
      }

      expect(core.getState()).toEqual(newState)

      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[0].mocks.update.mock.calls[1]).toEqual([
        newState,
      ])
      expect(core[Symbol.for('uppy test: getPlugins')]('acquirer')[1].mocks.update.mock.calls[1]).toEqual([
        newState,
      ])

      expect(stateUpdateEventMock.mock.calls.length).toEqual(2)
      // current state
      expect(stateUpdateEventMock.mock.calls[1][0]).toEqual({
        bee: 'boo',
        capabilities: { individualCancellation: true, uploadProgress: true, resumableUploads: false },
        files: {},
        currentUploads: {},
        allowNewUpload: true,
        foo: 'bar',
        info: [],
        meta: {},
        plugins: {},
        totalProgress: 0,
        recoveredState: null,
      })
      // new state
      expect(stateUpdateEventMock.mock.calls[1][1]).toEqual({
        bee: 'boo',
        capabilities: { individualCancellation: true, uploadProgress: true, resumableUploads: false },
        files: {},
        currentUploads: {},
        allowNewUpload: true,
        foo: 'baar',
        info: [],
        meta: {},
        plugins: {},
        totalProgress: 0,
        recoveredState: null,
      })
    })

    it('should get the state', () => {
      const core = new Core()

      core.setState({ foo: 'bar' })

      expect(core.getState()).toMatchObject({ foo: 'bar' })
    })
  })

  it('should reset when the reset method is called', () => {
    // use DeepFrozenStore in some tests to make sure we are not mutating things
    const core = new Core({
      store: DeepFrozenStore(),
    })
    // const corePauseEventMock = jest.fn()
    const coreCancelEventMock = jest.fn()
    const coreStateUpdateEventMock = jest.fn()
    core.on('cancel-all', coreCancelEventMock)
    core.on('state-update', coreStateUpdateEventMock)
    core.setState({ foo: 'bar', totalProgress: 30 })

    core.reset()

    expect(coreCancelEventMock).toHaveBeenCalledWith({ reason: 'user' }, undefined, undefined, undefined, undefined, undefined)
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(2)
    expect(coreStateUpdateEventMock.mock.calls[1][1]).toEqual({
      capabilities: { individualCancellation: true, uploadProgress: true, resumableUploads: false },
      files: {},
      currentUploads: {},
      allowNewUpload: true,
      error: null,
      foo: 'bar',
      info: [],
      meta: {},
      plugins: {},
      totalProgress: 0,
      recoveredState: null,
    })
  })

  it('should clear all uploads and files on cancelAll()', () => {
    const core = new Core()

    core.addFile({
      source: 'jest',
      name: 'foo1.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    core.addFile({
      source: 'jest',
      name: 'foo2.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    const fileIDs = Object.keys(core.getState().files)
    const id = core[Symbol.for('uppy test: createUpload')](fileIDs)

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(2)

    core.cancelAll()

    expect(core.getState().currentUploads[id]).toBeUndefined()
    expect(Object.keys(core.getState().files).length).toEqual(0)
  })

  it('should allow remove all uploads when individualCancellation is disabled', () => {
    const core = new Core()

    const { capabilities } = core.getState()
    core.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: false,
      },
    })

    core.addFile({
      source: 'jest',
      name: 'foo1.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    core.addFile({
      source: 'jest',
      name: 'foo2.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    const fileIDs = Object.keys(core.getState().files)
    const id = core[Symbol.for('uppy test: createUpload')](fileIDs)

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(2)

    core.removeFiles(fileIDs)

    expect(core.getState().currentUploads[id]).toBeUndefined()
    expect(Object.keys(core.getState().files).length).toEqual(0)
  })

  it('should disallow remove one upload when individualCancellation is disabled', () => {
    const core = new Core()

    const { capabilities } = core.getState()
    core.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: false,
      },
    })

    core.addFile({
      source: 'jest',
      name: 'foo1.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    core.addFile({
      source: 'jest',
      name: 'foo2.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    const fileIDs = Object.keys(core.getState().files)
    const id = core[Symbol.for('uppy test: createUpload')](fileIDs)

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(2)

    assert.throws(() => core.removeFile(fileIDs[0]), /individualCancellation is disabled/)

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(2)
  })

  it('should allow remove one upload when individualCancellation is enabled', () => {
    const core = new Core()

    const { capabilities } = core.getState()
    core.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: true,
      },
    })

    core.addFile({
      source: 'jest',
      name: 'foo1.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    core.addFile({
      source: 'jest',
      name: 'foo2.jpg',
      type: 'image/jpeg',
      data: new File([sampleImage], { type: 'image/jpeg' }),
    })

    const fileIDs = Object.keys(core.getState().files)
    const id = core[Symbol.for('uppy test: createUpload')](fileIDs)

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(2)

    core.removeFile(fileIDs[0])

    expect(core.getState().currentUploads[id]).toBeDefined()
    expect(Object.keys(core.getState().files).length).toEqual(1)
  })

  it('should close, reset and uninstall when the close method is called', () => {
    // use DeepFrozenStore in some tests to make sure we are not mutating things
    const core = new Core({
      store: DeepFrozenStore(),
    })
    core.use(AcquirerPlugin1)

    const coreCancelEventMock = jest.fn()
    const coreStateUpdateEventMock = jest.fn()
    const plugin = core[Symbol.for('uppy test: getPlugins')]('acquirer')[0]

    core.on('cancel-all', coreCancelEventMock)
    core.on('state-update', coreStateUpdateEventMock)

    core.close()

    expect(coreCancelEventMock).toHaveBeenCalledWith({ reason: 'user' }, undefined, undefined, undefined, undefined, undefined)
    expect(coreStateUpdateEventMock.mock.calls.length).toEqual(1)
    expect(coreStateUpdateEventMock.mock.calls[0][1]).toEqual({
      capabilities: { individualCancellation: true, uploadProgress: true, resumableUploads: false },
      files: {},
      currentUploads: {},
      allowNewUpload: true,
      error: null,
      info: [],
      meta: {},
      plugins: {},
      totalProgress: 0,
      recoveredState: null,
    })
    expect(plugin.mocks.uninstall.mock.calls.length).toEqual(1)

    const pluginIteration = jest.fn()
    core.iteratePlugins(pluginIteration)
    expect(pluginIteration.mock.calls.length).toEqual(0)
  })

  describe('upload hooks', () => {
    it('should add data returned from upload hooks to the .upload() result', () => {
      const core = new Core()
      core.addPreProcessor((_, uploadID) => {
        core.addResultData(uploadID, { pre: 'ok' })
      })
      core.addPostProcessor((_, uploadID) => {
        core.addResultData(uploadID, { post: 'ok' })
      })
      core.addUploader((_, uploadID) => {
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
    it('should add and remove preprocessor', () => {
      const core = new Core()
      const preprocessor = () => { }
      expect(core.removePreProcessor(preprocessor)).toBe(false)
      core.addPreProcessor(preprocessor)
      expect(core.removePreProcessor(preprocessor)).toBe(true)
      expect(core.removePreProcessor(preprocessor)).toBe(false)
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
        data: new File([sampleImage], { type: 'image/jpeg' }),
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

    it('should not pass removed file IDs to next step', async () => {
      const core = new Core()
      const uploader = jest.fn()
      core.addPreProcessor((fileIDs) => {
        core.removeFile(fileIDs[0])
      })
      core.addUploader(uploader)

      core.addFile({
        source: 'jest',
        name: 'rmd.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'kept.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      await core.upload()

      expect(uploader.mock.calls.length).toEqual(1)
      expect(uploader.mock.calls[0][0].length).toEqual(1, 'Got 1 file ID')
      expect(core.getFile(uploader.mock.calls[0][0][0]).name).toEqual('kept.jpg')
    })

    it('should update the file progress state when preprocess-progress event is fired', () => {
      const core = new Core()
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0,
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
        preprocess: { mode: 'determinate', message: 'something', value: 0 },
      })
    })

    it('should update the file progress state when preprocess-complete event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileID = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileID)
      core.emit('preprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0,
      })
      expect(core.getFile(fileID).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })
    })
  })

  describe('postprocessors', () => {
    it('should add and remove postprocessor', () => {
      const core = new Core()
      const postprocessor = () => { }
      expect(core.removePostProcessor(postprocessor)).toBe(false)
      core.addPostProcessor(postprocessor)
      expect(core.removePostProcessor(postprocessor)).toBe(true)
      expect(core.removePostProcessor(postprocessor)).toBe(false)
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
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      return core.upload().then(() => {
        expect(postprocessor1.mock.calls.length).toEqual(1)
        // const lastModifiedTime = new Date()
        // const fileId = 'foojpg' + lastModifiedTime.getTime()
        const fileId = 'uppy-foo/jpg-1e-image'

        expect(postprocessor1.mock.calls[0][0].length).toEqual(1)
        expect(postprocessor1.mock.calls[0][0][0].substring(0, 17)).toEqual(
          fileId.substring(0, 17),
        )

        expect(postprocessor2.mock.calls[0][0].length).toEqual(1)
        expect(postprocessor2.mock.calls[0][0][0].substring(0, 17)).toEqual(
          fileId.substring(0, 17),
        )
      })
    })

    it('should update the file progress state when postprocess-progress event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('postprocess-progress', file, {
        mode: 'determinate',
        message: 'something',
        value: 0,
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
        postprocess: { mode: 'determinate', message: 'something', value: 0 },
      })
    })

    it('should update the file progress state when postprocess-complete event is fired', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('postprocess-complete', file, {
        mode: 'determinate',
        message: 'something',
        value: 0,
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })
    })

    it('should report an error if post-processing a file fails', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('error', new Error('foooooo'), file)

      expect(core.getState().error).toEqual('foooooo')

      expect(core.upload()).resolves.toMatchObject({
        failed: [
          { name: 'foo.jpg' },
        ],
      })
    })
  })

  describe('uploaders', () => {
    it('should add and remove uploader', () => {
      const core = new Core()
      const uploader = () => { }
      expect(core.removeUploader(uploader)).toBe(false)
      core.addUploader(uploader)
      expect(core.removeUploader(uploader)).toBe(true)
      expect(core.removeUploader(uploader)).toBe(false)
    })
  })

  describe('adding a file', () => {
    it('should call onBeforeFileAdded if it was specified in the options when initialising the class', () => {
      const onBeforeFileAdded = jest.fn()
      const core = new Core({
        onBeforeFileAdded,
      })

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
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

      const fileId = core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: fileData,
      })
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
          uploadStarted: null,
        },
        remote: '',
        size: 17175,
        source: 'jest',
        type: 'image/jpeg',
      }
      expect(core.getFile(fileId)).toEqual(newFile)
      expect(fileAddedEventMock.mock.calls[0][0]).toEqual(newFile)
    })

    it('should not allow a file that does not meet the restrictions', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['image/gif', 'video/webm'],
        },
      })

      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
      }).toThrow('You can only upload: image/gif, video/webm')

      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo.webm',
          type: 'video/webm; codecs="vp8, opus"',
          data: new File([sampleImage], { type: 'video/webm; codecs="vp8, opus"' }),
        })
      }).not.toThrow()
    })

    it('should not allow a dupicate file, a file with the same id', () => {
      const core = new Core()
      const sameFileBlob = new File([sampleImage], { type: 'image/jpeg' })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: sameFileBlob,
      })
      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: sameFileBlob,
          meta: {
            notARelativePath: 'folder/a',
          },
        })
      }).toThrow(
        "Cannot add the duplicate file 'foo.jpg', it already exists",
      )
      expect(core.getFiles().length).toEqual(1)
    })

    it('should allow a duplicate file if its relativePath is different, thus the id is different', () => {
      const core = new Core()
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
        meta: {
          relativePath: 'folder/a',
        },
      })
      expect(core.getFiles().length).toEqual(2)
    })

    it('should not allow a file if onBeforeFileAdded returned false', () => {
      const core = new Core({
        onBeforeFileAdded: (file) => {
          if (file.source === 'jest') {
            return false
          }
          return undefined
        },
      })
      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
      }).toThrow(
        'Cannot add the file because onBeforeFileAdded returned false.',
      )
      expect(core.getFiles().length).toEqual(0)
    })

    describe('with allowMultipleUploadBatches: false', () => {
      it('allows no new files after upload', async () => {
        const core = new Core({ allowMultipleUploadBatches: false })
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })

        await core.upload()

        expect(() => {
          core.addFile({
            source: 'jest',
            name: '123.foo',
            type: 'image/jpeg',
            data: new File([sampleImage], { type: 'image/jpeg' }),
          })
        }).toThrow(
          /Cannot add more files/,
        )
      })

      it('allows no new files after upload with legacy allowMultipleUploads option', async () => {
        const core = new Core({ allowMultipleUploads: false })
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })

        await core.upload()

        expect(() => {
          core.addFile({
            source: 'jest',
            name: '123.foo',
            type: 'image/jpeg',
            data: new File([sampleImage], { type: 'image/jpeg' }),
          })
        }).toThrow(
          /Cannot add more files/,
        )
      })

      it('does not allow new files after the removeFile() if some file is still present', async () => {
        const core = new Core({ allowMultipleUploadBatches: false })

        // adding 2 files
        const fileId1 = core.addFile({
          source: 'jest',
          name: '1.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        core.addFile({
          source: 'jest',
          name: '2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })

        // removing 1 file
        core.removeFile(fileId1)

        await expect(core.upload()).resolves.toBeDefined()
      })

      it('allows new files after the last removeFile()', async () => {
        const core = new Core({ allowMultipleUploadBatches: false })

        // adding 2 files
        const fileId1 = core.addFile({
          source: 'jest',
          name: '1.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        const fileId2 = core.addFile({
          source: 'jest',
          name: '2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })

        // removing 2 files
        core.removeFile(fileId1)
        core.removeFile(fileId2)

        await expect(core.upload()).resolves.toBeDefined()
      })
    })

    it('does not dedupe different files', async () => {
      const core = new Core()
      const data = new Blob([sampleImage], { type: 'image/jpeg' })
      data.lastModified = 1562770350937

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data,
      })
      core.addFile({
        source: 'jest',
        name: 'foo푸.jpg',
        type: 'image/jpeg',
        data,
      })

      expect(core.getFiles()).toHaveLength(2)
      expect(core.getFile('uppy-foo/jpg-1e-image/jpeg-17175-1562770350937')).toBeDefined()
      expect(core.getFile('uppy-foo//jpg-1l3o-1e-image/jpeg-17175-1562770350937')).toBeDefined()
    })
  })

  describe('uploading a file', () => {
    it('should return a { successful, failed } pair containing file objects', () => {
      const core = new Core()
      core.addUploader(() => Promise.resolve())

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })

      return expect(core.upload()).resolves.toMatchObject({
        successful: [
          { name: 'foo.jpg' },
          { name: 'bar.jpg' },
        ],
        failed: [],
      })
    })

    it('should return files with errors in the { failed } key', () => {
      // use DeepFrozenStore in some tests to make sure we are not mutating things
      const core = new Core({
        store: DeepFrozenStore(),
      })
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
          { name: 'foo.jpg' },
        ],
        failed: [
          { name: 'bar.jpg', error: 'This is bar and I do not like bar' },
        ],
      })
    })

    it('should only upload files that are not already assigned to another upload id', () => {
      const core = new Core()
      core.store.state.currentUploads = {
        upload1: {
          fileIDs: ['uppy-file1/jpg-1e-image/jpeg', 'uppy-file2/jpg-1e-image/jpeg', 'uppy-file3/jpg-1e-image/jpeg'],
        },
        upload2: {
          fileIDs: ['uppy-file4/jpg-1e-image/jpeg', 'uppy-file5/jpg-1e-image/jpeg', 'uppy-file6/jpg-1e-image/jpeg'],
        },
      }
      core.addUploader(() => Promise.resolve())

      core.addFile({ source: 'jest', name: 'foo.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'jest', name: 'bar.jpg', type: 'image/jpeg', data: new Uint8Array() })
      core.addFile({ source: 'file3', name: 'file3.jpg', type: 'image/jpeg', data: new Uint8Array() })

      return expect(core.upload()).resolves.toMatchSnapshot()
    })

    it('should not upload if onBeforeUpload returned false', () => {
      const core = new Core({
        onBeforeUpload: (files) => {
          for (const fileId in files) {
            if (files[fileId].name === '123.foo') {
              return false
            }
          }
          return undefined
        },
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: '123.foo',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      return core.upload().catch((err) => {
        expect(err).toMatchObject(new Error('Not starting the upload because onBeforeUpload returned false'))
      })
    })

    it('only allows a single upload() batch when allowMultipleUploadBatches: false', async () => {
      const core = new Core({ allowMultipleUploadBatches: false })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      await expect(core.upload()).resolves.toBeDefined()
      await expect(core.upload()).rejects.toThrow(
        /Cannot create a new upload: already uploading\./,
      )
    })

    it('allows new files again with allowMultipleUploadBatches: false after reset() was called', async () => {
      const core = new Core({ allowMultipleUploadBatches: false })

      core.addFile({
        source: 'jest',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      await expect(core.upload()).resolves.toBeDefined()

      core.reset()

      core.addFile({
        source: 'jest',
        name: '123.foo',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      await expect(core.upload()).resolves.toBeDefined()
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
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      expect(core.getFiles().length).toEqual(1)
      core.setState({
        totalProgress: 50,
      })

      const file = core.getFile(fileId)
      core.removeFile(fileId)

      expect(core.getFiles().length).toEqual(0)
      expect(fileRemovedEventMock.mock.calls[0][0]).toEqual(file)
      expect(core.getState().totalProgress).toEqual(0)
    })
  })

  describe('retries', () => {
    it('should start a new upload with failed files', async () => {
      const onUpload = jest.fn()
      const onRetryAll = jest.fn()

      const core = new Core()
      core.on('upload', onUpload)
      core.on('retry-all', onRetryAll)

      const id = core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.setFileState(id, {
        error: 'something went wrong',
      })

      await core.retryAll()
      expect(onRetryAll).toHaveBeenCalled()
      expect(onUpload).toHaveBeenCalled()
    })

    it('should not start a new upload if there are no failed files', async () => {
      const onUpload = jest.fn()

      const core = new Core()
      core.on('upload', onUpload)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      await core.retryAll()
      expect(onUpload).not.toHaveBeenCalled()
    })
  })

  describe('restoring a file', () => {
    xit('should restore a file', () => { })

    xit("should fail to restore a file if it doesn't exist", () => { })
  })

  describe('get a file', () => {
    it('should get the specified file', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
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
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'empty.dat',
        type: 'application/octet-stream',
        data: new File([new Uint8Array(1000)], { type: 'application/octet-stream' }),
      })

      expect(core.getFiles()).toHaveLength(2)
      expect(core.getFiles().map((file) => file.name).sort()).toEqual(['empty.dat', 'foo.jpg'])
    })
  })

  describe('setOptions', () => {
    it('should change options on the fly', () => {
      const core = new Core()
      core.setOptions({
        id: 'lolUppy',
        autoProceed: true,
        allowMultipleUploadBatches: true,
      })

      expect(core.opts.id).toEqual('lolUppy')
      expect(core.opts.autoProceed).toEqual(true)
      expect(core.opts.allowMultipleUploadBatches).toEqual(true)
    })

    it('should change locale on the fly', () => {
      const core = new Core()
      expect(core.i18n('cancel')).toEqual('Cancel')

      core.setOptions({
        locale: {
          strings: {
            cancel: 'Отмена',
          },
        },
      })

      expect(core.i18n('cancel')).toEqual('Отмена')
      expect(core.i18n('logOut')).toEqual('Log out')
    })

    it('should change meta on the fly', () => {
      const core = new Core({
        meta: {
          foo: 'bar',
        },
      })
      expect(core.state.meta).toMatchObject({
        foo: 'bar',
      })

      core.setOptions({
        meta: {
          beep: 'boop',
        },
      })

      expect(core.state.meta).toMatchObject({
        foo: 'bar',
        beep: 'boop',
      })
    })

    it('should change restrictions on the fly', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['image/jpeg'],
          maxNumberOfFiles: 2,
        },
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo1.png',
          type: 'image/png',
          data: new File([sampleImage], { type: 'image/png' }),
        })
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: image/jpeg'))
      }

      core.setOptions({
        restrictions: {
          allowedFileTypes: ['image/png'],
        },
      })

      expect(core.opts.restrictions.allowedFileTypes).toMatchObject(['image/png'])

      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo1.png',
          type: 'image/png',
          data: new File([sampleImage], { type: 'image/png' }),
        })
      }).not.toThrow()

      expect(core.getFiles().length).toEqual(1)
    })
  })

  describe('meta data', () => {
    it('should set meta data by calling setMeta', () => {
      // use DeepFrozenStore in some tests to make sure we are not mutating things
      const core = new Core({
        store: DeepFrozenStore(),
        meta: { foo2: 'bar2' },
      })
      core.setMeta({ foo: 'bar', bur: 'mur' })
      core.setMeta({ boo: 'moo', bur: 'fur' })
      expect(core.getState().meta).toEqual({
        foo: 'bar',
        foo2: 'bar2',
        boo: 'moo',
        bur: 'fur',
      })
    })

    it('should update meta data for a file by calling updateMeta', () => {
      const core = new Core()

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      core.setFileMeta(fileId, { foo: 'bar', bur: 'mur' })
      core.setFileMeta(fileId, { boo: 'moo', bur: 'fur' })
      expect(core.getFile(fileId).meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo: 'bar',
        bur: 'fur',
        boo: 'moo',
      })
    })

    it('should merge meta data when add file', () => {
      const core = new Core({
        meta: { foo2: 'bar2' },
      })
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        meta: {
          resize: 5000,
        },
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      const fileId = Object.keys(core.getState().files)[0]
      expect(core.getFile(fileId).meta).toEqual({
        name: 'foo.jpg',
        type: 'image/jpeg',
        foo2: 'bar2',
        resize: 5000,
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
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const fileId = Object.keys(core.getState().files)[0]
      const file = core.getFile(fileId)
      core.emit('upload-progress', file, {
        bytesUploaded: 12345,
        bytesTotal: 17175,
      })
      expect(core.getFile(fileId).progress).toEqual({
        percentage: 72,
        bytesUploaded: 12345,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })

      core.emit('upload-progress', file, {
        bytesUploaded: 17175,
        bytesTotal: 17175,
      })

      core.calculateProgress.flush()

      expect(core.getFile(fileId).progress).toEqual({
        percentage: 100,
        bytesUploaded: 17175,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })
    })

    it('should work with unsized files', async () => {
      const core = new Core()
      let proceedUpload
      let finishUpload
      const promise = new Promise((resolve) => { proceedUpload = resolve })
      const finishPromise = new Promise((resolve) => { finishUpload = resolve })
      core.addUploader(async ([id]) => {
        core.emit('upload-started', core.getFile(id))
        await promise
        core.emit('upload-progress', core.getFile(id), {
          bytesTotal: 3456,
          bytesUploaded: 1234,
        })
        await finishPromise
        core.emit('upload-success', core.getFile(id), { uploadURL: 'lol' })
      })

      core.addFile({
        source: 'instagram',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: {},
      })

      core.calculateTotalProgress()

      const uploadPromise = core.upload()
      await new Promise((resolve) => core.once('upload-started', resolve))

      expect(core.getFiles()[0].size).toBeNull()
      expect(core.getFiles()[0].progress).toMatchObject({
        bytesUploaded: 0,
        // null indicates unsized
        bytesTotal: null,
        percentage: 0,
      })

      proceedUpload()
      // wait for progress event
      await promise

      expect(core.getFiles()[0].size).toBeNull()
      expect(core.getFiles()[0].progress).toMatchObject({
        bytesUploaded: 1234,
        bytesTotal: 3456,
        percentage: 36,
      })

      expect(core.getState().totalProgress).toBe(36)

      finishUpload()
      // wait for success event
      await finishPromise

      expect(core.getFiles()[0].size).toBe(3456)
      expect(core.getFiles()[0].progress).toMatchObject({
        bytesUploaded: 3456,
        bytesTotal: 3456,
        percentage: 100,
      })

      await uploadPromise

      core.close()
    })

    it('should estimate progress for unsized files', () => {
      const core = new Core()

      core.once('file-added', (file) => {
        core.emit('upload-started', file)
        core.emit('upload-progress', file, {
          bytesTotal: 3456,
          bytesUploaded: 1234,
        })
      })
      core.addFile({
        source: 'instagram',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: {},
      })

      core.once('file-added', (file) => {
        core.emit('upload-started', file)
        core.emit('upload-progress', file, {
          bytesTotal: null,
          bytesUploaded: null,
        })
      })
      core.addFile({
        source: 'instagram',
        name: 'bar.jpg',
        type: 'image/jpeg',
        data: {},
      })

      core.calculateTotalProgress()

      // foo.jpg at 35%, bar.jpg at 0%
      expect(core.getState().totalProgress).toBe(18)

      core.close()
    })

    it('should calculate the total progress of all file uploads', () => {
      // use DeepFrozenStore in some tests to make sure we are not mutating things
      const core = new Core({
        store: DeepFrozenStore(),
      })

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const [file1, file2] = core.getFiles()
      core.setFileState(file1.id, { progress: { ...file1.progress, uploadStarted: new Date() } })
      core.setFileState(file2.id, { progress: { ...file2.progress, uploadStarted: new Date() } })

      core.emit('upload-progress', core.getFile(file1.id), {
        bytesUploaded: 12345,
        bytesTotal: 17175,
      })

      core.emit('upload-progress', core.getFile(file2.id), {
        bytesUploaded: 10201,
        bytesTotal: 17175,
      })

      core.calculateTotalProgress()
      core.calculateProgress.flush()

      expect(core.getState().totalProgress).toEqual(66)
    })

    it('should reset the progress', () => {
      const resetProgressEvent = jest.fn()
      const core = new Core()
      core.on('reset-progress', resetProgressEvent)

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      core.addFile({
        source: 'jest',
        name: 'foo2.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      const [file1, file2] = core.getFiles()
      core.setFileState(file1.id, { progress: { ...file1.progress, uploadStarted: new Date() } })
      core.setFileState(file2.id, { progress: { ...file2.progress, uploadStarted: new Date() } })

      core.emit('upload-progress', core.getFile(file1.id), {
        bytesUploaded: 12345,
        bytesTotal: 17175,
      })

      core.emit('upload-progress', core.getFile(file2.id), {
        bytesUploaded: 10201,
        bytesTotal: 17175,
      })

      core.calculateTotalProgress()
      core.calculateProgress.flush()

      expect(core.getState().totalProgress).toEqual(66)

      core.resetProgress()

      expect(core.getFile(file1.id).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })
      expect(core.getFile(file2.id).progress).toEqual({
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: 17175,
        uploadComplete: false,
        uploadStarted: null,
      })
      expect(core.getState().totalProgress).toEqual(0)
      expect(resetProgressEvent.mock.calls.length).toEqual(1)
    })
  })

  describe('checkRestrictions', () => {
    it('should enforce the maxNumberOfFiles rule', () => {
      const core = new Core({
        restrictions: {
          maxNumberOfFiles: 1,
        },
      })

      // add 2 files
      core.addFile({
        source: 'jest',
        name: 'foo1.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })
      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload 1 file'))
        expect(core.getState().info[0].message).toEqual('You can only upload 1 file')
      }
    })

    it('should not enforce the maxNumberOfFiles rule for ghost files', () => {
      const core = new Core({
        restrictions: {
          maxNumberOfFiles: 1,
        },
      })

      expect(() => {
        // add 1 ghost file
        const fileId1 = core.addFile({
          source: 'jest',
          name: 'foo1.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        core.setFileState(fileId1, { isGhost: true })

        // add another file
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
      }).not.toThrowError()
    })

    xit('should enforce the minNumberOfFiles rule', () => { })

    it('should enforce the allowedFileTypes rule', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['image/gif', 'image/png'],
        },
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: image/gif, image/png'))
        expect(core.getState().info[0].message).toEqual('You can only upload: image/gif, image/png')
      }
    })

    it('should throw if allowedFileTypes is not an array', () => {
      try {
        const core = new Core({
          restrictions: {
            allowedFileTypes: 'image/gif',
          },
        })
        core.log('hi')
      } catch (err) {
        expect(err).toMatchObject(new Error('`restrictions.allowedFileTypes` must be an array'))
      }
    })

    it('should enforce the allowedFileTypes rule with file extensions', () => {
      const core = new Core({
        restrictions: {
          allowedFileTypes: ['.gif', '.jpg', '.jpeg'],
        },
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo2.png',
          type: '',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('You can only upload: .gif, .jpg, .jpeg'))
        expect(core.getState().info[0].message).toEqual('You can only upload: .gif, .jpg, .jpeg')
      }

      expect(() => core.addFile({
        source: 'jest',
        name: 'foo2.JPG',
        type: '',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      }).not.toThrow())
    })

    it('should enforce the maxFileSize rule', () => {
      const core = new Core({
        restrictions: {
          maxFileSize: 1234,
        },
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('foo.jpg exceeds maximum allowed size of 1.2 KB'))
        expect(core.getState().info[0].message).toEqual('foo.jpg exceeds maximum allowed size of 1.2 KB')
      }
    })

    it('should enforce the minFileSize rule', () => {
      const core = new Core({
        restrictions: {
          minFileSize: 1073741824,
        },
      })

      try {
        core.addFile({
          source: 'jest',
          name: 'foo.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toMatchObject(new Error('This file is smaller than the allowed size of 1 GB'))
        expect(core.getState().info[0].message).toEqual('This file is smaller than the allowed size of 1 GB')
      }
    })

    it('should enforce the maxTotalFileSize rule', () => {
      const core = new Core({
        restrictions: {
          maxTotalFileSize: 34000,
        },
      })

      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      expect(() => {
        core.addFile({
          source: 'jest',
          name: 'foo1.jpg',
          type: 'image/jpeg',
          data: new File([sampleImage], { type: 'image/jpeg' }),
        })
      }).toThrowError(
        new Error('foo1.jpg exceeds maximum allowed size of 33 KB'),
      )
    })

    it('should check if a file validateRestrictions', () => {
      const core = new Core({
        restrictions: {
          minFileSize: 300000,
        },
      })

      const core2 = new Core({
        restrictions: {
          allowedFileTypes: ['image/png'],
        },
      })

      const newFile = {
        source: 'jest',
        name: 'foo1.jpg',
        extension: 'jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
        isFolder: false,
        mimeType: 'image/jpeg',
        modifiedDate: '2016-04-13T15:11:31.204Z',
        size: 270733,
      }

      const validateRestrictions1 = core.validateRestrictions(newFile)
      const validateRestrictions2 = core2.validateRestrictions(newFile)

      expect(validateRestrictions1).toMatchObject(
        {
          result: false,
          reason: 'This file is smaller than the allowed size of 293 KB',
        },
      )
      expect(validateRestrictions2).toMatchObject(
        {
          result: false,
          reason: 'You can only upload: image/png',
        },
      )
    })

    it('should emit `restriction-failed` event when some rule is violated', () => {
      const maxFileSize = 100
      const core = new Core({
        restrictions: {
          maxFileSize,
        },
      })
      const restrictionsViolatedEventMock = jest.fn()
      const file = {
        name: 'test.jpg',
        data: new Blob([new Uint8Array(2 * maxFileSize)]),
      }
      const errorMessage = core.i18n('exceedsSize', { file: file.name, size: prettierBytes(maxFileSize) })
      try {
        core.on('restriction-failed', restrictionsViolatedEventMock)
        core.addFile(file)
      } catch {
        // Ignore errors
      }

      expect(restrictionsViolatedEventMock.mock.calls.length).toEqual(1)
      expect(restrictionsViolatedEventMock.mock.calls[0][0].name).toEqual(file.name)
      expect(restrictionsViolatedEventMock.mock.calls[0][1].message).toEqual(errorMessage)
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
            name: 'filename',
          },
        },
      })
      core.emit('upload-error', core.getFile('fileId'), new Error('this is the error'))
      expect(core.getState().info).toEqual([{
        message: 'Failed to upload filename',
        details: 'this is the error',
        type: 'error',
      }])
    })

    it('should reset the error state when receiving the upload event', () => {
      const core = new Core()
      core.emit('error', { foo: 'bar' })
      core.emit('upload')
      expect(core.getState().error).toEqual(null)
    })
  })

  describe('updateOnlineStatus', () => {
    const RealNavigatorOnline = globalThis.window.navigator.onLine

    function mockNavigatorOnline (status) {
      Object.defineProperty(
        globalThis.window.navigator,
        'onLine',
        {
          value: status,
          writable: true,
        },
      )
    }

    afterEach(() => {
      globalThis.window.navigator.onLine = RealNavigatorOnline
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
      expect(core.getState().info).toEqual([{
        type: 'info',
        message: 'This is the message',
        details: null,
      }])
      expect(infoVisibleEvent.mock.calls.length).toEqual(1)
    })

    it('should set a object based message to be displayed infinitely', () => {
      const infoVisibleEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)

      core.info({
        message: 'This is the message',
        details: {
          foo: 'bar',
        },
      }, 'warning', 0)
      expect(core.getState().info).toEqual([{
        type: 'warning',
        message: 'This is the message',
        details: {
          foo: 'bar',
        },
      }])
      expect(infoVisibleEvent.mock.calls.length).toEqual(1)
    })

    it('should set an info message to be displayed for a period of time before hiding', (done) => {
      const infoVisibleEvent = jest.fn()
      const infoHiddenEvent = jest.fn()
      const core = new Core()
      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 100)
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      setTimeout(() => {
        expect(infoHiddenEvent.mock.calls.length).toEqual(1)
        expect(core.getState().info).toEqual([])
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
      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      core.hideInfo()
      expect(infoHiddenEvent.mock.calls.length).toEqual(1)
      expect(core.getState().info).toEqual([])
    })

    it('should support multiple messages', () => {
      const infoVisibleEvent = jest.fn()
      const infoHiddenEvent = jest.fn()
      const core = new Core()

      core.on('info-visible', infoVisibleEvent)
      core.on('info-hidden', infoHiddenEvent)

      core.info('This is the message', 'info', 0)
      core.info('But this is another one', 'info', 0)

      expect(infoHiddenEvent.mock.calls.length).toEqual(0)
      expect(core.getState().info).toEqual([
        {
          type: 'info',
          message: 'This is the message',
          details: null,
        },
        {
          type: 'info',
          message: 'But this is another one',
          details: null,
        },
      ])
      core.hideInfo()

      expect(core.getState().info).toEqual([
        {
          type: 'info',
          message: 'But this is another one',
          details: null,
        },
      ])

      core.hideInfo()

      expect(infoHiddenEvent.mock.calls.length).toEqual(2)
      expect(core.getState().info).toEqual([])
    })
  })

  describe('createUpload', () => {
    it('should assign the specified files to a new upload', () => {
      const core = new Core()
      core.addFile({
        source: 'jest',
        name: 'foo.jpg',
        type: 'image/jpeg',
        data: new File([sampleImage], { type: 'image/jpeg' }),
      })

      core[Symbol.for('uppy test: createUpload')](Object.keys(core.getState().files))
      const uploadId = Object.keys(core.getState().currentUploads)[0]
      const currentUploadsState = {}
      currentUploadsState[uploadId] = {
        fileIDs: Object.keys(core.getState().files),
        step: 0,
        result: {},
      }
      expect(core.getState().currentUploads).toEqual(currentUploadsState)
    })
  })

  describe('i18n', () => {
    it('merges in custom locale strings', () => {
      const core = new Core({
        locale: {
          strings: {
            test: 'beep boop',
          },
        },
      })

      expect(core.i18n('exceedsSize')).toBe('%{file} exceeds maximum allowed size of %{size}')
      expect(core.i18n('test')).toBe('beep boop')
    })
  })

  describe('default restrictions', () => {
    it('should be merged with supplied restrictions', () => {
      const core = new Core({
        restrictions: {
          maxNumberOfFiles: 3,
        },
      })

      expect(core.opts.restrictions.maxNumberOfFiles).toBe(3)
      expect(core.opts.restrictions.minNumberOfFiles).toBe(null)
    })
  })

  describe('log', () => {
    it('should log via provided logger function', () => {
      const myTestLogger = {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }

      const core = new Core({
        logger: myTestLogger,
      })

      core.log('test test')
      core.log('test test', 'error')
      core.log('test test', 'error')
      core.log('test test', 'warning')

      // logger.debug should have been called 1 time above,
      // but we call log in Core’s constructor to output VERSION, hence +1 here
      expect(core.opts.logger.debug.mock.calls.length).toBe(2)
      expect(core.opts.logger.error.mock.calls.length).toBe(2)
      expect(core.opts.logger.warn.mock.calls.length).toBe(1)
    })

    it('should log via provided logger function, even if debug: true', () => {
      const myTestLogger = {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }

      const core = new Core({
        logger: myTestLogger,
        debug: true,
      })

      core.log('test test')
      core.log('test test', 'error')
      core.log('test test', 'error')
      core.log('test test', 'warning')

      // logger.debug should have been called 1 time above,
      // but we call log in Core’s constructor to output VERSION, hence +1 here
      expect(core.opts.logger.debug.mock.calls.length).toBe(2)
      expect(core.opts.logger.error.mock.calls.length).toBe(2)
      // logger.warn should have been called 1 time above,
      // but we warn in Core when using both logger and debug: true, hence +1 here
      expect(core.opts.logger.warn.mock.calls.length).toBe(2)
    })

    it('should log to console when logger: Uppy.debugLogger or debug: true is set', () => {
      console.debug = jest.fn()
      console.error = jest.fn()

      const core = new Core({
        logger: Core.debugLogger,
      })

      core.log('test test')
      core.log('beep boop')
      core.log('beep beep', 'error')

      // console.debug debug should have been called 2 times above,
      // ibut we call log n Core’ constructor to output VERSION, hence +1 here
      expect(console.debug.mock.calls.length).toBe(3)
      expect(console.error.mock.calls.length).toBe(1)

      console.debug.mockClear()
      console.error.mockClear()

      const core2 = new Core({
        debug: true,
      })

      core2.log('test test')
      core2.log('beep boop')
      core2.log('beep beep', 'error')

      // console.debug debug should have been called 2 times here,
      // but we call log in Core constructor to output VERSION, hence +1 here
      expect(console.debug.mock.calls.length).toBe(3)
      expect(console.error.mock.calls.length).toBe(1)
    })

    it('should only log errors to console when logger is not set', () => {
      console.debug = jest.fn()
      console.error = jest.fn()

      const core = new Core()

      core.log('test test')
      core.log('beep boop')
      core.log('beep beep', 'error')

      expect(console.debug.mock.calls.length).toBe(0)
      expect(console.error.mock.calls.length).toBe(1)
    })
  })
})
