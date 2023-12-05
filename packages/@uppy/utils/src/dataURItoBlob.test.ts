import { describe, expect, it } from 'vitest'
import dataURItoBlob from './dataURItoBlob.ts'
import sampleImageDataURI from './sampleImageDataURI.ts'

describe('dataURItoBlob', () => {
  it('should convert a data uri to a blob', () => {
    const blob = dataURItoBlob(sampleImageDataURI, {})
    expect(blob instanceof Blob).toEqual(true)
    expect(blob.size).toEqual(9348)
    expect(blob.type).toEqual('image/jpeg')
  })
})
