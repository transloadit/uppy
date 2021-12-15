import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Transloadit from '@uppy/transloadit'

function initUppyTransloadit (transloaditKey) {
  const uppyTransloadit = new Uppy({
    id: 'uppyTransloadit',
    debug: true,
    autoProceed: true,
  })

  uppyTransloadit
    .use(Dashboard, {
      target: '#uppy-transloadit',
      inline: true,
    })
    .use(Transloadit, {
      service: 'https://api2-ap-southeast-1.transloadit.com',
      params: {
        auth: { key: transloaditKey },
        steps: {
          crop_thumbed: {
            use: [':original'],
            robot: '/image/resize',
            height: 100,
            resize_strategy: 'crop',
            width: 100,
          },
        },
      },
      waitForEncoding: true,
    })

  uppyTransloadit.on('transloadit:result', (stepName, result) => {
    // use transloadit encoding result here.
    const img = new Image()
    img.onload = function onload () {
      const resultDiv = document.createElement('div')
      resultDiv.setAttribute('id', 'uppy-result')
      resultDiv.textContent = 'ok'
      document.body.appendChild(resultDiv)
    }
    img.src = result.url
  })
}

window.initUppyTransloadit = initUppyTransloadit
