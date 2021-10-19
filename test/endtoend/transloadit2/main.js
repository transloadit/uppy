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
      getAssemblyOptions () {
        return {
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
          fields: {
            message: 'test',
          },
        }
      },
      waitForEncoding: true,
    })

  uppyTransloadit.on('transloadit:result', (_, __, assembly) => {
    // use transloadit encoding result here.
    const result = document.createElement('div')
    result.setAttribute('id', 'uppy-result')
    result.textContent = assembly.fields.message === 'test' ? 'ok' : 'fail'
    document.body.appendChild(result)
  })
}

window.initUppyTransloadit = initUppyTransloadit
