module.exports = function babel (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
