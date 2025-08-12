import fs from 'node:fs'
import path from 'node:path'
import Core from '@uppy/core'
import { getFileNameAndExtension } from '@uppy/utils'
import { describe, expect, it } from 'vitest'
import CompressorPlugin from './index.js'

// Compressor uses browser canvas API, so need to mock compress()
// @ts-expect-error mocked
CompressorPlugin.prototype.compress = async (blob: File) => {
  return {
    name: `${getFileNameAndExtension(blob.name).name}.webp`,
    type: 'image/webp',
    data: blob,
    size: 123,
  }
}

const sampleImage = fs.readFileSync(
  path.join(__dirname, '../fixtures/image.jpg'),
)

const file1 = {
  source: 'test',
  name: 'image-1.jpeg',
  type: 'image/jpeg',
  data: new File([sampleImage], 'image-1.jpeg', { type: 'image/jpeg' }),
}
const file2 = {
  source: 'test',
  name: 'yolo',
  type: 'image/jpeg',
  data: new File([sampleImage], 'yolo', { type: 'image/jpeg' }),
}
const file3 = {
  source: 'test',
  name: 'my.file.is.weird.png',
  type: 'image/png',
  data: new File([sampleImage], 'my.file.is.weird.png', { type: 'image/png' }),
}

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
