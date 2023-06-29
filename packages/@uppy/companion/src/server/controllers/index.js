/* eslint-disable global-require */
module.exports = {
  callback: require('./callback'),
  deauthorizationCallback: require('./deauth-callback'),
  sendToken: require('./send-token'),
  get: require('./get'),
  thumbnail: require('./thumbnail'),
  list: require('./list'),
  logout: require('./logout'),
  connect: require('./connect'),
  preauth: require('./preauth'),
  redirect: require('./oauth-redirect'),
  refreshToken: require('./refresh-token'),
}
