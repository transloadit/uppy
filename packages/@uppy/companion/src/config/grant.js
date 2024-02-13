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
      // access_type: offline is needed in order to get refresh tokens.
      // prompt: 'consent' is needed because sometimes a user will get stuck in an authenticated state where we will
      // receive no refresh tokens from them. This seems to be happen when running on different subdomains.
      // therefore to be safe that we always get refresh tokens, we set this.
      // https://stackoverflow.com/questions/10827920/not-receiving-google-oauth-refresh-token/65108513#65108513
      custom_params: { access_type : 'offline', prompt: 'consent' },
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
  }
}
