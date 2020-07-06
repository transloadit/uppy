// oauth configuration for provider services that are used.
module.exports = () => {
  return {
    // for drive
    google: {
      transport: 'session',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      callback: '/drive/callback'
    },
    dropbox: {
      transport: 'session',
      authorize_url: 'https://www.dropbox.com/oauth2/authorize',
      access_url: 'https://api.dropbox.com/oauth2/token',
      callback: '/dropbox/callback'
    },
    instagram: {
      transport: 'session',
      callback: '/instagram/callback'
    },
    facebook: {
      transport: 'session',
      scope: ['email', 'user_photos'],
      callback: '/facebook/callback'
    },
    // for onedrive
    microsoft: {
      transport: 'session',
      scope: ['files.read.all', 'offline_access', 'User.Read'],
      callback: '/onedrive/callback'
    }
  }
}
