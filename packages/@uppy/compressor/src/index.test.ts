import Core from '@uppy/core'
import { getFileNameAndExtension } from '@uppy/core/utils'
import { describe, expect, it } from 'vitest'
import sampleImage from '../fixtures/image.jpg'
import CompressorPlugin from './index.js'

async function getSampleImage(name: string): Promise<File> {
  const response = await fetch(sampleImage)
  const blob = await response.blob()
  return new File([blob], name, { type: blob.type })
}

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

describe('CompressorPlugin', () => {
  it('should change update extension in file.name and file.meta.name', async () => {
    const uppy = new Core()
    uppy.use(CompressorPlugin, {
      quality: 0.85,
      mimeType: 'image/webp',
    })

    uppy.addFile({
      source: 'test',
      name: 'image-1.jpeg',
      type: 'image/jpeg',
      data: await getSampleImage('image-1.jpeg'),
    })
    uppy.addFile({
      source: 'test',
      name: 'yolo',
      type: 'image/jpeg',
      data: await getSampleImage('yolo'),
    })
    uppy.addFile({
      source: 'test',
      name: 'my.file.is.weird.png',
      type: 'image/png',
      data: await getSampleImage('my.file.is.weird.png'),
    })

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
