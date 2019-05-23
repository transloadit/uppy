module.exports = {
  plugins: {
    'postcss-inline-svg': {
      path: 'src/images'
    },
    autoprefixer: {
      browsers: ['last 2 versions']
    },
    cssnano: { safe: true }
  }
}
