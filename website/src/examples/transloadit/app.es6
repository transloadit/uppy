const Uppy = require('uppy/lib/core/Core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const Webcam = require('uppy/lib/plugins/Webcam')
const Transloadit = require('uppy/lib/plugins/Transloadit')
const Instagram = require('uppy/lib/plugins/Instagram')

function initUppy () {
  if (window.uppy) {
    window.uppy.close()
  }

  const uppy = Uppy({
    debug: true,
    autoProceed: false,
    restrictions: {
      maxFileSize: 1024 * 1024 * 1024,
      maxNumberOfFiles: 2,
      minNumberOfFiles: 1,
      allowedFileTypes: ['image/*']
    }
  })

  uppy
    .use(Transloadit, {
      params: {
        auth: {
          key: window.TRANSLOADIT_API_KEY
        },
        // It's more secure to use a template_id and enable
        // Signature Authentication
        steps: {
          resize: {
            robot: '/image/resize',
            width: 250,
            height: 250,
            resize_strategy: 'fit',
            text: [
              {
                text: '© 2018 Transloadit.com',
                size: 12,
                font: 'Ubuntu',
                color: '#eeeeee',
                valign: 'bottom',
                align: 'right',
                x_offset: 16,
                y_offset: -10
              }
            ]
          }
        }
      },
      waitForEncoding: true
    })
    .use(Dashboard, {
      inline: true,
      maxHeight: 400,
      target: '#uppy-dashboard-container',
      note: 'Images only, 1–2 files, up to 1 MB'
    })
    .use(Instagram, { target: Dashboard, serverUrl: 'https://api2.transloadit.com/uppy-server' })
    .use(Webcam, { target: Dashboard })

  uppy
    .on('transloadit:result', (stepName, result) => {
      const file = uppy.getFile(result.localId)
      var resultContainer = document.createElement('div')
      resultContainer.innerHTML = `
        <div>
          <h3>Name: ${file.name}</h3>
          <img src="${result.ssl_url}" /> <br />
          <a href="${result.ssl_url}">View</a>
        </div>
      `
      document
        .getElementById('uppy-transloadit-result')
        .appendChild(resultContainer)
    })
}

window.initUppy = initUppy
