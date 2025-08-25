import { describe, expect, it } from 'vitest'
import getFileType from './getFileType.js'
import type { UppyFile } from './UppyFile.js'

describe('getFileType', () => {
  it('should trust the filetype if the file comes from a remote source', () => {
    const file = {
      isRemote: true,
      type: 'audio/webm',
      name: 'foo.webm',
    } as any as UppyFile<any, any>
    expect(getFileType(file)).toEqual('audio/webm')
  })

  it('should determine the filetype from the mimetype', () => {
    const file = {
      type: 'audio/webm',
      name: 'foo.webm',
      data: 'sdfsdfhq9efbicw',
    } as any as UppyFile<any, any>
    expect(getFileType(file)).toEqual('audio/webm')
  })

  it('should determine the filetype from the extension', () => {
    const fileMP3 = {
      name: 'foo.mp3',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    const fileYAML = {
      name: 'bar.yaml',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    const fileMKV = {
      name: 'bar.mkv',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    const fileDicom = {
      name: 'bar.dicom',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    const fileWebp = {
      name: 'bar.webp',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    const toUpper = (file: UppyFile<any, any>) => ({
      ...file,
      name: file.name!.toUpperCase(),
    })
    expect(getFileType(fileMP3)).toEqual('audio/mp3')
    expect(getFileType(toUpper(fileMP3))).toEqual('audio/mp3')
    expect(getFileType(fileYAML)).toEqual('text/yaml')
    expect(getFileType(toUpper(fileYAML))).toEqual('text/yaml')
    expect(getFileType(fileMKV)).toEqual('video/x-matroska')
    expect(getFileType(toUpper(fileMKV))).toEqual('video/x-matroska')
    expect(getFileType(fileDicom)).toEqual('application/dicom')
    expect(getFileType(toUpper(fileDicom))).toEqual('application/dicom')
    expect(getFileType(fileWebp)).toEqual('image/webp')
    expect(getFileType(toUpper(fileWebp))).toEqual('image/webp')
  })

  it('should fail gracefully if unable to detect', () => {
    const file = {
      name: 'foobar',
      data: 'sdfsfhfh329fhwihs',
    } as any as UppyFile<any, any>
    expect(getFileType(file)).toEqual('application/octet-stream')
  })
})
