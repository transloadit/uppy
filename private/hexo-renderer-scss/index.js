/* global hexo */
const sass = require('node-sass')
const dlv = require('dlv')

function sassRenderer (data, options, callback) {
  const self = this
  const themeCfg = self.theme.config || {}

  // support global and theme-specific config
  const userConfig = {
    ...themeCfg.node_sass,
    ...self.config.node_sass
  }

  const config = {
    data: data.text,
    file: data.path,
    outputStyle: 'nested',
    sourceComments: false,
    functions: {
      'hexo-theme-config($ckey)': function (ckey) {
        const val = dlv(themeCfg, ckey.getValue())
        const sassVal = new sass.types.String(val)
        if (userConfig.debug) {
          console.log('hexo-theme-config.' + ckey.getValue(), val)
        }
        return sassVal
      },
      'hexo-config($ckey)': function (ckey) {
        const val = dlv(self.config, ckey.getValue())
        const sassVal = new sass.types.String(val)
        if (userConfig.debug) {
          console.log('hexo-config.' + ckey.getValue(), val)
        }
        return sassVal
      }
    },
    ...userConfig
  }

  sass.render(config, (err, res) => {
    if (err) {
      callback(err)
      return
    }
    callback(null, res.css.toString())
  })
}

hexo.extend.renderer.register('scss', 'css', sassRenderer)
hexo.extend.renderer.register('sass', 'css', sassRenderer)
