const generateFileID = require('./generateFileID')

describe('generateFileID', () => {
  it('should take the filename object and produce a lowercase file id made up of uppy- prefix, file name (cleaned up to be lowercase, letters and numbers only), type, size and lastModified date', () => {
    const fileObj = {
      name: 'fOo0Fi@£$.jpg',
      type: 'image/jpeg',
      data: {
        lastModified: 1498510508000,
        size: 2271173
      }
    }

    expect(generateFileID(fileObj)).toEqual(
      'uppy-foo0fijpg-image/jpeg-2271173-1498510508000'
    )
  })
})
