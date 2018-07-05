require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const XHRUpload = require('@uppy/xhr-upload')
const ProgressBar = require('@uppy/progress-bar')

const uppyi18n = Uppy({
  id: 'uppyi18n',
  debug: true
})

uppyi18n
  .use(DragDrop, {
    target: '#uppyi18n',
    locale: {
      strings: {
        dropHereOr: 'Перенесите файлы сюда или %{browse}',
        browse: 'выберите'
      }
    }
  })
  .use(ProgressBar, { target: '#uppyi18n-progress' })
  .use(XHRUpload, { endpoint: 'https://api2.transloadit.com' })
