const defaults = require('./constants')

module.exports.responses = {
  files: {
    get: {
      kind: 'drive#fileList',
      nextPageToken: defaults.NEXT_PAGE_TOKEN,
      files: [
        {
          kind: 'drive#file',
          id: defaults.ITEM_ID,
          name: defaults.ITEM_NAME,
          mimeType: defaults.MIME_TYPE,
          iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
          thumbnailLink: defaults.THUMBNAIL_URL,
          modifiedTime: '2016-07-10T20:00:08.096Z',
          ownedByMe: true,
          permissions: [{ role: 'owner', emailAddress: defaults.USERNAME }],
          size: '758051',
        },
      ],
    },
  },
  drives: {
    get: { kind: 'drive#driveList', drives: [] },
  },
  [`files/${defaults.ITEM_ID}`]: {
    get: {
      kind: 'drive#file',
      id: defaults.ITEM_ID,
      name: 'MY DUMMY FILE NAME.mp4',
      mimeType: 'video/mp4',
      iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
      thumbnailLink: 'https://DUMMY-THUMBNAIL.com/file.jpg',
      modifiedTime: '2016-07-10T20:00:08.096Z',
      ownedByMe: true,
      permissions: [{ role: 'owner', emailAddress: 'john.doe@transloadit.com' }],
      size: '758051',
    },
  },
  [`files/${defaults.ITEM_ID}?alt=media&supportsAllDrives=true`]: {
    get: {},
  },
  'https://accounts.google.com/o/oauth2/revoke': {
    get: {},
  },
}

module.exports.expects = {}
