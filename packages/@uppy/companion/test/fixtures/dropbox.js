const defaults = require('./constants')

module.exports.responses = {
  'users/get_current_account': {
    post: {
      name: {
        given_name: 'Franz',
        surname: 'Ferdinand',
        familiar_name: 'Franz',
        display_name: 'Franz Ferdinand (Personal)',
        abbreviated_name: 'FF',
      },
      email: defaults.USERNAME,
      email_verified: true,
      disabled: false,
      locale: 'en',
      referral_link: 'https://db.tt/ZITNuhtI',
      is_paired: true,
    },
  },
  'files/list_folder': {
    post: {
      entries: [
        {
          '.tag': 'file',
          name: defaults.ITEM_NAME,
          id: defaults.ITEM_ID,
          client_modified: '2015-05-12T15:50:38Z',
          server_modified: '2015-05-12T15:50:38Z',
          rev: 'a1c10ce0dd78',
          size: defaults.FILE_SIZE,
          path_lower: '/homework/math/prime_numbers.txt',
          path_display: '/Homework/math/Prime_Numbers.txt',
          is_downloadable: true,
          has_explicit_shared_members: false,
          content_hash: 'e3b0c44298fc1c149afbf41e4649b934ca49',
          file_lock_info: {
            is_lockholder: true,
            lockholder_name: 'Imaginary User',
            created: '2015-05-12T15:50:38Z',
          },
        },
      ],
      cursor: 'ZtkX9_EHj3x7PMkVuFIhwKYXEpwpLwyxp9vMKomUhllil9q7eWiAu',
      has_more: false,
    },
  },
  'files/get_metadata': {
    post: {
      size: defaults.FILE_SIZE,
    },
  },
  'auth/token/revoke': {
    post: {},
  },
  'https://content.dropboxapi.com/2/files/download': {
    post: {},
  },
}

module.exports.expects = {
  itemIcon: 'file',
  itemRequestPath: '%2Fhomework%2Fmath%2Fprime_numbers.txt',
}
