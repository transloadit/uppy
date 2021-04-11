const defaults = require('./constants')

module.exports.responses = {
  'users/me': {
    get: {
      login: defaults.USERNAME,
    },
  },
  'folders/0/items': {
    get: {
      entries: [
        {
          type: 'file',
          name: defaults.ITEM_NAME,
          id: defaults.ITEM_ID,
          modified_at: '2015-05-12T15:50:38Z',
          size: defaults.FILE_SIZE,
        },
      ],
    },
  },
  [`files/${defaults.ITEM_ID}`]: {
    get: {
      size: defaults.FILE_SIZE,
    },
  },
  'https://api.box.com/oauth2/revoke': {
    post: {},
  },
  [`files/${defaults.ITEM_ID}/content`]: {
    get: {},
  },
}

module.exports.expects = {
  itemIcon: 'file',
}
