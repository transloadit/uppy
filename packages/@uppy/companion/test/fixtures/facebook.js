const defaults = require('./constants')

module.exports.responses = {
  me: {
    get: {
      name: 'Fiona Fox',
      birthday: '01/01/1985',
      email: defaults.USERNAME,
    },
  },
  'https://graph.facebook.com/ALBUM-ID/photos': {
    get: {
      data: [
        {
          images: [
            {
              height: 1365,
              source: defaults.THUMBNAIL_URL,
              width: 2048,
            },
          ],
          width: 720,
          height: 479,
          created_time: '2015-07-17T17:26:50+0000',
          id: defaults.ITEM_ID,
        },
      ],
      paging: {},
    },
  },
  'me/permissions': {
    delete: {},
  },
  [`https://graph.facebook.com/${defaults.ITEM_ID}?fields=images`]: {
    get: {
      images: [
        {
          height: 1365,
          source: defaults.THUMBNAIL_URL,
          width: 2048,
        },
      ],
      id: defaults.ITEM_ID,
    },
  },
}

module.exports.expects = {
  listPath: 'ALBUM-ID',
  itemName: `${defaults.ITEM_ID} 2015-07-17T17:26:50+0000`,
  itemMimeType: 'image/jpeg',
  itemSize: null,
}
