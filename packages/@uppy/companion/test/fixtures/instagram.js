const defaults = require('./constants')

module.exports.responses = {
  'https://graph.instagram.com/me': {
    get: {
      id: '17841405793187218',
      username: defaults.USERNAME,
    },
  },
  'https://graph.instagram.com/me/media': {
    get: {
      data: [
        {
          id: defaults.ITEM_ID,
          media_type: 'IMAGE',
          timestamp: '2017-08-31T18:10:00+0000',
          media_url: defaults.THUMBNAIL_URL,
        },
      ],
    },
  },
  [`https://graph.instagram.com/${defaults.ITEM_ID}`]: {
    get: {
      id: defaults.ITEM_ID,
      media_type: 'IMAGE',
      media_url: defaults.THUMBNAIL_URL,
      timestamp: '2017-08-31T18:10:00+0000',
    },
  },
  [defaults.THUMBNAIL_URL]: {
    get: {},
  },
}

module.exports.expects = {
  itemName: 'Instagram 2017-08-31T18:10:00+00000.jpeg',
  itemMimeType: 'image/jpeg',
  itemSize: null,
}
