import { describe, expect, it } from 'vitest'
import dataURItoFile from './dataURItoFile.js'
import sampleImageDataURI from './sampleImageDataURI.js'

describe('dataURItoFile', () => {
  it('should convert a data uri to a file', () => {
    const file = dataURItoFile(sampleImageDataURI, { name: 'foo.jpg' })
    expect(file instanceof File).toEqual(true)
    expect(file.size).toEqual(9348)
    expect(file.type).toEqual('image/jpeg')
    expect(file.name).toEqual('foo.jpg')
  })
})
