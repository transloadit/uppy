/* eslint-env browser */
const marked = require('marked')
const dragdrop = require('drag-drop')
const transloadit = require('@uppy/transloadit-wrapper')

// TOP SECRET!!!!!!!
const TRANSLOADIT_KEY = '05a61ed019fe11e783fdbd1f56c73eb0'

const THUMB_SIZE = [400, 300]

/* eslint-disable no-template-curly-in-string */
const IMAGE_FILTER = ['${file.mime}', 'regex', 'image/']
const VIDEO_FILTER = ['${file.mime}', 'regex', 'video/']
const AUDIO_FILTER = ['${file.mime}', 'regex', 'audio/']
/* eslint-enable no-template-curly-in-string */

const transloaditSteps = {
  ':original': {
    robot: '/upload/handle'
  },

  // Separate source files

  images: {
    use: [':original'],
    robot: '/file/filter',
    result: true,
    accepts: [IMAGE_FILTER]
  },
  videos: {
    use: [':original'],
    robot: '/file/filter',
    result: true,
    accepts: [VIDEO_FILTER]
  },
  audios: {
    use: [':original'],
    robot: '/file/filter',
    result: true,
    accepts: [AUDIO_FILTER]
  },
  others: {
    use: [':original'],
    robot: '/file/filter',
    result: true,
    rejects: [IMAGE_FILTER, VIDEO_FILTER, AUDIO_FILTER]
  },

  // Generate thumbs for different types of files

  audio_thumbnails: {
    use: ['audios'],
    robot: '/audio/artwork'
  },
  resized_thumbnails: {
    use: ['images', 'audio_thumbnails'],
    robot: '/image/resize',
    imagemagick_stack: 'v1.0.0',
    width: THUMB_SIZE[0],
    height: THUMB_SIZE[1],
    resize_strategy: 'fit',
    zoom: false
  },
  video_thumbnails: {
    use: ['videos'],
    robot: '/video/thumbs',
    ffmpeg_stack: 'v2.2.3',
    count: 1,
    offsets: ['50%'],
    format: 'jpeg',
    width: THUMB_SIZE[0],
    height: THUMB_SIZE[1],
    resize_strategy: 'fit'
  },

  // Optimize thumbnails for decent file size

  thumbnails: {
    use: ['resized_thumbnails', 'video_thumbnails'],
    robot: '/image/optimize'
  },

  // Store all the things away

  store_sources: {
    use: ['images', 'videos', 'audios', 'others'],
    robot: '/s3/store',
    credentials: 'uppy_test_s3',
    // eslint-disable-next-line no-template-curly-in-string
    path: 'markdownbin/sources/${unique_prefix}/${file.url_name}',
    result: true
  },
  store_thumbnails: {
    use: ['thumbnails'],
    robot: '/s3/store',
    credentials: 'uppy_test_s3',
    // eslint-disable-next-line no-template-curly-in-string
    path: 'markdownbin/thumbs/${file.md5hash}',
    result: true
  }
}

class MarkdownTextarea {
  constructor (element) {
    this.element = element
    this.controls = document.createElement('div')
    this.controls.classList.add('mdtxt-controls')
    this.uploadLine = document.createElement('div')
    this.uploadLine.classList.add('mdtxt-upload')

    this.uploadLine.appendChild(
      document.createTextNode('Upload an attachment'))
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
    transloadit.upload({
      waitForEncoding: true,
      params: {
        auth: { key: TRANSLOADIT_KEY },
        steps: transloaditSteps
      }
    }).then((result) => {
      this.insertAttachments(
        this.matchFilesAndThumbs(result.results)
      )
    }).catch((err) => {
      console.error(err)
      this.reportUploadError(err)
    })
  }

  pickFiles () {
    transloadit.pick({
      waitForEncoding: true,
      params: {
        auth: { key: TRANSLOADIT_KEY },
        steps: transloaditSteps
      }
    }).then((result) => {
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
