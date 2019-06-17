// oauth configuration for provider services that are used.
module.exports = () => {
  return {
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
    }
  }
}
