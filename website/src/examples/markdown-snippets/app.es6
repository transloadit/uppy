/* eslint-env browser */
const marked = require('marked')
const dragdrop = require('drag-drop')
// Add Robodog JS. It is advisable to install Robodog from npm/yarn.
// But for experimenting, you can use also Transloadit’s CDN, Edgly:
// <script src="https://transloadit.edgly.net/releases/uppy/robodog/v1.9.7/robodog.min.js"></script>
const robodog = require('@uppy/robodog')

const TRANSLOADIT_EXAMPLE_KEY = '35c1aed03f5011e982b6afe82599b6a0'
const TRANSLOADIT_EXAMPLE_TEMPLATE = '0b2ee2bc25dc43619700c2ce0a75164a'

/**
 * A textarea for markdown text, with support for file attachments.
 *
 * ## Usage
 *
 * ```js
 * const element = document.querySelector('textarea')
 * const mdtxt = new MarkdownTextarea(element)
 * mdtxt.install()
 * ```
 */
class MarkdownTextarea {
  constructor (element) {
    this.element = element
    this.controls = document.createElement('div')
    this.controls.classList.add('mdtxt-controls')
    this.uploadLine = document.createElement('button')
    this.uploadLine.setAttribute('type', 'button')
    this.uploadLine.classList.add('form-upload')

    this.uploadLine.appendChild(
      document.createTextNode('Tap here to upload an attachment'))
  }

  install () {
    const { element } = this
    const wrapper = document.createElement('div')
    wrapper.classList.add('mdtxt')
    element.parentNode.replaceChild(wrapper, element)
    wrapper.appendChild(this.controls)
    wrapper.appendChild(element)
    wrapper.appendChild(this.uploadLine)

    this.setupUploadLine()
    this.setupTextareaDrop()
  }

  setupTextareaDrop () {
    dragdrop(this.element, (files) => {
      this.uploadFiles(files)
    })
  }

  setupUploadLine () {
    this.uploadLine.addEventListener('click', () => {
      this.pickFiles()
    })
  }

  reportUploadError (err) {
    this.uploadLine.classList.add('error')
    const message = document.createElement('span')
    message.appendChild(document.createTextNode(err.message))
    this.uploadLine.insertChild(message, this.uploadLine.firstChild)
  }

  unreportUploadError () {
    this.uploadLine.classList.remove('error')
    const message = this.uploadLine.querySelector('message')
    if (message) {
      this.uploadLine.removeChild(message)
    }
  }

  insertAttachments (attachments) {
    attachments.forEach((attachment) => {
      const { file, thumb } = attachment
      const link = `\n[LABEL](${file.ssl_url})\n`
      const labelText = `View File ${file.basename}`
      if (thumb) {
        this.element.value += link.replace('LABEL', `![${labelText}](${thumb.ssl_url})`)
      } else {
        this.element.value += link.replace('LABEL', labelText)
      }
    })
  }

  matchFilesAndThumbs (results) {
    const filesById = {}
    const thumbsById = {}

    results.forEach((result) => {
      if (result.stepName === 'thumbnails') {
        thumbsById[result.original_id] = result
      } else {
        filesById[result.original_id] = result
      }
    })

    return Object.keys(filesById).reduce((acc, key) => {
      const file = filesById[key]
      const thumb = thumbsById[key]
      acc.push({ file, thumb })
      return acc
    }, [])
  }

  uploadFiles (files) {
    robodog.upload(files, {
      waitForEncoding: true,
      params: {
        auth: { key: TRANSLOADIT_EXAMPLE_KEY },
        template_id: TRANSLOADIT_EXAMPLE_TEMPLATE
      }
    }).then((result) => {
      if (result === null) return
      this.insertAttachments(
        this.matchFilesAndThumbs(result.results)
      )
    }).catch((err) => {
      console.error(err)
      this.reportUploadError(err)
    })
  }

  pickFiles () {
    robodog.pick({
      waitForEncoding: true,
      params: {
        auth: { key: TRANSLOADIT_EXAMPLE_KEY },
        template_id: TRANSLOADIT_EXAMPLE_TEMPLATE
      },
      providers: [
        'webcam',
        'url',
        'instagram',
        'google-drive',
        'dropbox'
      ]
    }).then((result) => {
      if (result === null) return
      this.insertAttachments(
        this.matchFilesAndThumbs(result.results)
      )
    }).catch((err) => {
      console.error(err)
      this.reportUploadError(err)
    })
  }
}

const textarea = new MarkdownTextarea(
  document.querySelector('#new textarea'))
textarea.install()

function renderSnippet (title, text) {
  const template = document.querySelector('#snippet')
  const newSnippet = document.importNode(template.content, true)
  const titleEl = newSnippet.querySelector('.snippet-title')
  const contentEl = newSnippet.querySelector('.snippet-content')

  titleEl.appendChild(document.createTextNode(title))
  contentEl.innerHTML = marked(text)

  const list = document.querySelector('#snippets')
  list.insertBefore(newSnippet, list.firstChild)
}

function saveSnippet (title, text) {
  const id = parseInt(localStorage.numSnippets || 0, 10)
  localStorage[`snippet_${id}`] = JSON.stringify({ title, text })
  localStorage.numSnippets = id + 1
}

function loadSnippets () {
  for (let id = 0; localStorage[`snippet_${id}`] != null; id += 1) {
    const { title, text } = JSON.parse(localStorage[`snippet_${id}`])
    renderSnippet(title, text)
  }
}

document.querySelector('#new').addEventListener('submit', (event) => {
  event.preventDefault()

  const title = event.target.querySelector('input[name="title"]').value ||
    'Unnamed Snippet'
  const text = textarea.element.value

  saveSnippet(title, text)
  renderSnippet(title, text)

  event.target.querySelector('input').value = ''
  event.target.querySelector('textarea').value = ''
})

window.addEventListener('DOMContentLoaded', () => {
  loadSnippets()
})
