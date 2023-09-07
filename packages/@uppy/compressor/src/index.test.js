import { describe, expect, it } from '@jest/globals'
import Core from '@uppy/core'
import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension'
import fs from 'node:fs'
import CompressorPlugin from './index.js'

// Compressor uses browser canvas API, so need to mock compress()
CompressorPlugin.prototype.compress = (blob) => {
  return {
    name: `${getFileNameAndExtension(blob.name).name}.webp`,
    type: 'image/webp',
    data: blob,
    size: 123,
  }
}

const sampleImage = fs.readFileSync(new URL('../../../../e2e/cypress/fixtures/images/image.jpg', import.meta.url))

const file1 = { source: 'jest', name: 'image-1.jpeg', type: 'image/jpeg', data: new File([sampleImage], 'image-1.jpeg', { type: 'image/jpeg' }) }
const file2 = { source: 'jest', name: 'yolo', type: 'image/jpeg', data: new File([sampleImage], 'yolo', { type: 'image/jpeg' }) }
const file3 = { source: 'jest', name: 'my.file.is.weird.png', type: 'image/png', data: new File([sampleImage], 'my.file.is.weird.png', { type: 'image/png' }) }

describe('CompressorPlugin', () => {
  it('should change update extension in file.name and file.meta.name', () => {
    const uppy = new Core()
    uppy.use(CompressorPlugin, {
      quality: 0.85,
      mimeType: 'image/webp',
    })

    uppy.addFile(file1)
    uppy.addFile(file2)
    uppy.addFile(file3)

    // User changed file.meta.name
    uppy.setFileMeta(uppy.getFiles()[0].id, { name: 'new-name.jpeg' })

    return uppy.upload().then(() => {
      const files = uppy.getFiles()

      expect(files[0].meta.name).toEqual('new-name.webp')
      expect(files[0].name).toEqual('image-1.webp')
      expect(files[0].meta.type).toEqual('image/webp')

      expect(files[1].meta.name).toEqual('yolo.webp')
      expect(files[1].meta.type).toEqual('image/webp')
      expect(files[1].name).toEqual('yolo.webp')

      expect(files[2].meta.name).toEqual('my.file.is.weird.webp')
      expect(files[2].meta.type).toEqual('image/webp')
      expect(files[2].name).toEqual('my.file.is.weird.webp')
    })
  })
})
