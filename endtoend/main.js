const Uppy = require('uppy/lib/core')
const DragDrop = require('uppy/lib/plugins/DragDrop')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Tus = require('uppy/lib/plugins/Tus')
const XHRUpload = require('uppy/lib/plugins/XHRUpload')
const ProgressBar = require('uppy/lib/plugins/ProgressBar')

// Initialise Uppy with Drag & Drop
const uppyDragDrop = Uppy({
  id: 'uppyDragDrop',
  debug: true
})
  .use(DragDrop, {
    target: '#uppyDragDrop'
  })
  .use(ProgressBar, { target: '#uppyDragDrop-progress' })
  .use(Tus, { endpoint: 'http://master.tus.io/files/' })
  .run()

const uppyi18n = Uppy({
  id: 'uppyi18n',
  debug: true
})
  .use(DragDrop, {
    target: '#uppyi18n',
    locale: {
      strings: {
        dropHereOr: 'Перенесите файлы сюда или',
        browse: 'выберите'
      }
    }
  })
  .use(ProgressBar, { target: '#uppyi18n-progress' })
  .use(XHRUpload, { endpoint: 'http://api2.transloadit.com' })
  .run()

const uppyDashboard = Uppy({
  id: 'uppyDashboard',
  debug: true
})
  .use(Dashboard, {
    target: '#uppyDashboard',
    inline: true
  })
  .use(Tus, { endpoint: 'http://master.tus.io/files/' })
  .run()

console.log(uppyDragDrop, uppyi18n, uppyDashboard)

// const b = Uppy({
//   id: 'b',
//   debug: true
// })
//   .use(Dashboard, {
//     target: '#b',
//     inline: true,
//     maxWidth: 400
//   })
//   .use(GoldenRetriever, { serviceWorker: false })
//   .run()

// window.a = a
// window.b = b
