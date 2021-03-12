module.exports = (api) => {
  api.env('test')
  return {
    presets: [
      ['@babel/preset-env', {
        modules: false,
        loose: true
      }]
    ],
    plugins: [
      ['@babel/plugin-transform-react-jsx', { pragma: 'h' }]
    ].filter(Boolean)
  }
}
