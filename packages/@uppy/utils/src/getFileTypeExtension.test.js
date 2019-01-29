const getFileTypeExtension = require('./getFileTypeExtension')

describe('getFileTypeExtension', () => {
  it('should return the filetype based on the specified mime type', () => {
    expect(getFileTypeExtension('video/ogg')).toEqual('ogv')
    expect(getFileTypeExtension('audio/ogg')).toEqual('ogg')
    expect(getFileTypeExtension('video/webm')).toEqual('webm')
    // Supports mime types with additional data
    expect(getFileTypeExtension('video/webm;codecs=vp8,opus')).toEqual('webm')
    expect(getFileTypeExtension('video/x-matroska;codecs=avc1')).toEqual('mkv')
    expect(getFileTypeExtension('audio/webm')).toEqual('webm')
    expect(getFileTypeExtension('video/mp4')).toEqual('mp4')
    expect(getFileTypeExtension('audio/mp3')).toEqual('mp3')
    expect(getFileTypeExtension('foo/bar')).toEqual(null)
  })
})
