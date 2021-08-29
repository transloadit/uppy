const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const Transloadit = require('@uppy/transloadit')

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
    console.log('Result here ====>', stepName, result)
    console.log('Cropped image url is here ====>', result.url)

    const img = new Image()
    img.onload = function onload () {
      const result = document.createElement('div')
      result.setAttribute('id', 'uppy-result')
      result.textContent = 'ok'
      document.body.appendChild(result)
    }
    img.src = result.url
  })
}

window.initUppyTransloadit = initUppyTransloadit
