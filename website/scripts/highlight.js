/* global hexo */
const Prism = require('node-prismjs')
const { decode } = require('he')
const { promisify } = require('util')
const readFile = promisify(require('fs').readFile)
const path = require('path')

const regex = /<pre><code class="(.*)?">([\s\S]*?)<\/code><\/pre>/igm
const captionRegex = /<p><code>(?![\s\S]*<code)(.*?)\s(.*?)\n([\s\S]*)<\/code><\/p>/igm

/**
 * Code transform for prism plugin.
 * @param {Object} data
 * @return {Object}
 */
function prismify (data) {
  // Patch for caption support
  if (captionRegex.test(data.content)) {
    // Attempt to parse the code
    data.content = data.content.replace(captionRegex, (origin, lang, caption, code) => {
      if (!lang || !caption || !code) return origin
      return `<figcaption>${caption}</figcaption><pre><code class="${lang}">${code}</code></pre>`
    })
  }

  function replace (lang, code) {
    const startTag = `<figure class="highlight ${lang}"><table><tr><td class="code"><pre>`
    const endTag = `</pre></td></tr></table></figure>`
    code = decode(code)
    let parsedCode = ''
    if (Prism.languages[lang]) {
      parsedCode = Prism.highlight(code, Prism.languages[lang])
    } else {
      parsedCode = code
    }

    return startTag + parsedCode + endTag
  }

  data.content = data.content.replace(regex, (origin, lang, code) => replace(lang, code))

  return data
}

function code (args, content) {
  let lang = ''
  if (args[0].startsWith('lang:')) {
    lang = args.shift().replace(/^lang:/, '')
  }

  return `<pre><code class="${lang}">${content}</code></pre>`
}

function includeCode (args) {
  let lang = ''
  if (args[0].startsWith('lang:')) {
    lang = args.shift().replace(/^lang:/, '')
  }

  const file = path.join(hexo.source_dir, hexo.config.code_dir, args.join(' '))
  return readFile(file, 'utf8')
    .then((code) => code.trim())
    .then((code) => `<pre><code class="${lang}">${code}</code></pre>`)
}

hexo.extend.filter.register('after_post_render', prismify)
hexo.extend.tag.register('codeblock', code, true)
hexo.extend.tag.register('include_code', includeCode, { async: true })
