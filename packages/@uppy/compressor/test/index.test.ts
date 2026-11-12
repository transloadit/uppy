import CompressorPlugin from '@uppy/compressor'
import Core, { Uppy } from '@uppy/core'
import { describe, expect, it } from 'vitest'
import sampleImage from '../fixtures/image.jpg'

async function getSampleImage(name: string): Promise<File> {
  const response = await fetch(sampleImage)
  const blob = await response.blob()
  return new File([blob], name, { type: blob.type })
}

describe('CompressorPlugin', () => {
  it('should change update extension in file.name and file.meta.name', async () => {
    using uppy = new Core()
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

    await uppy.upload()
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

  it('should skip remote images', async () => {
    using uppy = new Uppy().use(CompressorPlugin, {
      quality: 0.85,
      mimeType: 'image/webp',
    })

    uppy.addFile({
      isRemote: true,
      source: 'test',
      name: 'my.file.is.weird.png',
      type: 'image/png',
      data: await getSampleImage('my.file.is.weird.png'),
    })

    await uppy.upload()
    const file = uppy.getFiles()[0]

    expect(file.meta.name).toEqual('my.file.is.weird.png')
    expect(file.meta.type).toEqual('image/png')
    expect(file.name).toEqual('my.file.is.weird.png')
  })

  it('should skip non-image files', async () => {
    using uppy = new Uppy().use(CompressorPlugin, {
      quality: 0.85,
      mimeType: 'image/webp',
    })

    uppy.addFile(
      new File(['Hello text'], 'example.txt', { type: 'text/plain' }),
    )

    await uppy.upload()
    const file = uppy.getFiles()[0]

    expect(file.meta.name).toEqual('example.txt')
    expect(file.meta.type).toEqual('text/plain')
    expect(file.name).toEqual('example.txt')
  })
})
