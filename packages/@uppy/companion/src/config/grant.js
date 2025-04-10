const defaults = {
  transport: 'session',
  state: true, // Enable CSRF check
};

// oauth configuration for provider services that are used.
module.exports = () => {
  return {
    // we need separate auth providers because scopes are different,
    // and because it would be a too big rewrite to allow reuse of the same provider.
    googledrive: {
      ...defaults,
      // access_type: offline is needed in order to get refresh tokens.
      // prompt: 'consent' is needed because sometimes a user will get stuck in an authenticated state where we will
      // receive no refresh tokens from them. This seems to be happen when running on different subdomains.
      // therefore to be safe that we always get refresh tokens, we set this.
      // https://stackoverflow.com/questions/10827920/not-receiving-google-oauth-refresh-token/65108513#65108513
      custom_params: { access_type : 'offline', prompt: 'consent' },

      // copied from https://github.com/simov/grant/blob/master/config/oauth.json
      authorize_url: "https://accounts.google.com/o/oauth2/v2/auth",
      access_url: "https://oauth2.googleapis.com/token",
      oauth: 2,
      scope_delimiter: ' ',
      state: true,
      callback: '/drive/callback',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    },
    dropbox: {
      ...defaults,
      authorize_url: 'https://www.dropbox.com/oauth2/authorize',
      access_url: 'https://api.dropbox.com/oauth2/token',
      callback: '/dropbox/callback',
      custom_params: { token_access_type : 'offline' },
    },
    box: {
      ...defaults,
      authorize_url: 'https://account.box.com/api/oauth2/authorize',
      access_url: 'https://api.box.com/oauth2/token',
      callback: '/box/callback',
    },
    instagram: {
      ...defaults,
      callback: '/instagram/callback',
    },
    facebook: {
      ...defaults,
      scope: ['email', 'user_photos'],
      callback: '/facebook/callback',
    },
    // for onedrive
    microsoft: {
      ...defaults,
      scope: ['files.read.all', 'offline_access', 'User.Read'],
      callback: '/onedrive/callback',
    },
    zoom: {
      ...defaults,
      authorize_url: 'https://zoom.us/oauth/authorize',
      access_url: 'https://zoom.us/oauth/token',
      callback: '/zoom/callback',
    },
  }
}
