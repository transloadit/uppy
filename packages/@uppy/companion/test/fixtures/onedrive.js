const defaults = require('./constants')

module.exports.responses = {
  me: {
    get: {
      userPrincipalName: defaults.USERNAME,
      mail: defaults.USERNAME
    }
  },
  '/me/drive/root/children': {
    get: {
      value: [
        {
          createdDateTime: '2020-01-31T15:40:26.197Z',
          id: defaults.ITEM_ID,
          lastModifiedDateTime: '2020-01-31T15:40:38.723Z',
          name: defaults.ITEM_NAME,
          size: defaults.FILE_SIZE,
          parentReference: {
            driveId: 'DUMMY-DRIVE-ID',
            driveType: 'personal',
            path: '/drive/root:'
          },
          file: {
            mimeType: defaults.MIME_TYPE
          },
          thumbnails: [{
            id: '0',
            large: {
              height: 452,
              url: defaults.THUMBNAIL_URL,
              width: 800
            },
            medium: {
              height: 100,
              url: defaults.THUMBNAIL_URL,
              width: 176
            },
            small: {
              height: 54,
              url: defaults.THUMBNAIL_URL,
              width: 96
            }
          }]
        }
      ]
    }
  },
  [`/drives/DUMMY-DRIVE-ID/items/${defaults.ITEM_ID}`]: {
    get: {
      size: defaults.FILE_SIZE
    }
  },
  [`/drives/DUMMY-DRIVE-ID/items/${defaults.ITEM_ID}/content`]: {
    get: {}
  }
}

module.exports.expects = {
  itemRequestPath: `${defaults.ITEM_ID}?driveId=DUMMY-DRIVE-ID`
}
