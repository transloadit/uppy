// oauth configuration for provider services that are used.
module.exports = () => {
  return {
    // for drive
    google: {
      transport: 'session',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      callback: '/drive/callback',
      custom_params: { access_type : 'offline' },
    },
    dropbox: {
      transport: 'session',
      authorize_url: 'https://www.dropbox.com/oauth2/authorize',
      access_url: 'https://api.dropbox.com/oauth2/token',
      callback: '/dropbox/callback',
      custom_params: { token_access_type : 'offline' },
    },
    box: {
      transport: 'session',
      authorize_url: 'https://account.box.com/api/oauth2/authorize',
      access_url: 'https://api.box.com/oauth2/token',
      callback: '/box/callback',
    },
    instagram: {
      transport: 'session',
      callback: '/instagram/callback',
    },
    facebook: {
      transport: 'session',
      scope: ['email', 'user_photos'],
      callback: '/facebook/callback',
    },
    // for onedrive
    microsoft: {
      transport: 'session',
      scope: ['files.read.all', 'offline_access', 'User.Read'],
      callback: '/onedrive/callback',
    },
    zoom: {
      transport: 'session',
      authorize_url: 'https://zoom.us/oauth/authorize',
      access_url: 'https://zoom.us/oauth/token',
      callback: '/zoom/callback',
    },
    webdav: {
      transport: 'session',
      // use 'subdomain' for full domain (hostname) similar to mastodon:
      // https://github.com/simov/grant/blob/6e0692dfdd83edbc4ee82629ba0fe8f986d5879d/config/oauth.json#L631
      dynamic: ['subdomain'],
      authorize_url: 'https://[subdomain]/apps/oauth2/authorize',
      access_url: 'https://[subdomain]/apps/oauth2/api/v1/token',
      scope: ['profile'],
      oauth: 2,
      callback: '/webdav/callback',
    },
  }
}
