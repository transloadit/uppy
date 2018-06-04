/* global hexo */
const Prism = require('prismjs')
const entities = require('he')
const { promisify } = require('util')
const readFile = promisify(require('fs').readFile)
const path = require('path')

const unhighlightedCodeRx = /<pre><code class="(.*)?">([\s\S]*?)<\/code><\/pre>/igm

function highlight (lang, code) {
  const startTag = `<figure class="highlight ${lang}"><table><tr><td class="code"><pre>`
  const endTag = `</pre></td></tr></table></figure>`
  let parsedCode = ''
  if (Prism.languages[lang]) {
    parsedCode = Prism.highlight(code, Prism.languages[lang])
  } else {
    parsedCode = code
  }

  return startTag + parsedCode + endTag
}

function prismify (data) {
  data.content = data.content.replace(unhighlightedCodeRx,
    (_, lang, code) => highlight(lang, entities.decode(code)))

  return data
}

function code (args, content) {
  let lang = ''
  if (args[0].startsWith('lang:')) {
    lang = args.shift().replace(/^lang:/, '')
  }

  return highlight(lang, content)
}

function includeCode (args) {
  let lang = ''
  if (args[0].startsWith('lang:')) {
    lang = args.shift().replace(/^lang:/, '')
  }

  const file = path.join(hexo.source_dir, hexo.config.code_dir, args.join(' '))
  return readFile(file, 'utf8').then((code) => highlight(lang, code.trim()))
}

// Highlight as many things as we possibly can
hexo.extend.tag.register('code', code, true)
hexo.extend.tag.register('codeblock', code, true)
hexo.extend.tag.register('include_code', includeCode, { async: true })
hexo.extend.tag.register('include-code', includeCode, { async: true })

// Hexo includes its own code block handling by default which may
// cause the above to miss some things, so do another pass when the page
// is done rendering to pick up any code blocks we may have missed.
hexo.extend.filter.register('after_post_render', prismify)
