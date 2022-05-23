import { describe, expect, it } from '@jest/globals'
import generateFileID from './generateFileID.js'

describe('generateFileID', () => {
  it('should take the filename object and produce a lowercase file id made up of uppy- prefix, file name (cleaned up to be lowercase, letters and numbers only), type, relative path (folder) from file.meta.relativePath, size and lastModified date', () => {
    const fileObj = {
      name: 'fOo0Fi@£$.jpg',
      type: 'image/jpeg',
      data: {
        lastModified: 1498510508000,
        size: 2271173,
      },
    }

    expect(generateFileID(fileObj)).toEqual(
      'uppy-foo0fi////jpg-20-53-14-1e-image/jpeg-2271173-1498510508000',
    )

    expect(generateFileID({
      name: 'джумла-джpумлатест.jpg',
      type: 'image/jpeg',
      data: {
        lastModified: 1498510508000,
        size: 2271173,
      },
    })).toEqual(
      'uppy-/////////p/////////jpg-11k-11m-123-11s-11r-11g-1d-11k-11m-123-11s-11r-11g-122-11l-121-122-1e-image/jpeg-2271173-1498510508000',
    )

    expect(generateFileID({
      name: 'hello.jpg',
      type: 'image/jpeg',
      data: {
        lastModified: 1498510508000,
        size: 2271173,
      },
      meta: {
        relativePath: 'folder/a',
      },
    })).toEqual(
      'uppy-hello/jpg-1e-image/jpeg-folder/a-1f-2271173-1498510508000',
    )
  })
})
