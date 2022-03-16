const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Dropbox = require('@uppy/dropbox')
const Instagram = require('@uppy/instagram')
const Facebook = require('@uppy/facebook')
const OneDrive = require('@uppy/onedrive')
const Zoom = require('@uppy/zoom')
const Unsplash = require('@uppy/unsplash')
const Box = require('@uppy/box')
const ImageEditor = require('@uppy/image-editor')
const Url = require('@uppy/url')
const Webcam = require('@uppy/webcam')
const Audio = require('@uppy/audio')
const ScreenCapture = require('@uppy/screen-capture')
const Tus = require('@uppy/tus')
const DropTarget = require('@uppy/drop-target')
const GoldenRetriever = require('@uppy/golden-retriever')
const Compressor = require('@uppy/compressor')
const localeList = require('../locale_list.json')

const COMPANION = require('../env')

const RTL_LOCALES = ['ar_SA', 'fa_IR', 'he_IL']

if (typeof window !== 'undefined' && typeof window.Uppy === 'undefined') {
  window.Uppy = {
    locales: {},
  }
}

function uppyInit () {
  if (window.uppy) {
    window.uppy.close()
  }

  const opts = window.uppyOptions

  const uppy = new Uppy({
    logger: Uppy.debugLogger,
  })

  uppy.use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })

  uppy.on('complete', result => {
    console.log('successful files:')
    console.log(result.successful)
    console.log('failed files:')
    console.log(result.failed)
  })

  uppy.use(Dashboard, {
    trigger: '.UppyModalOpenerBtn',
    target: opts.DashboardInline ? '.DashboardContainer' : 'body',
    inline: opts.DashboardInline,
    height: 470,
    showProgressDetails: true,
    metaFields: [
      { id: 'name', name: 'Name', placeholder: 'file name' },
      { id: 'caption', name: 'Caption', placeholder: 'add description' },
    ],
  })

  window.uppy = uppy
}

function uppySetOptions () {
  const opts = window.uppyOptions

  const defaultNullRestrictions = {
    maxFileSize: null,
    minFileSize: null,
    maxNumberOfFiles: null,
    minNumberOfFiles: null,
    allowedFileTypes: null,
  }

  const restrictions = {
    maxFileSize: 1000000,
    maxNumberOfFiles: 3,
    minNumberOfFiles: 2,
    allowedFileTypes: ['image/*', 'video/*'],
    requiredMetaFields: ['caption'],
  }

  window.uppy.setOptions({
    autoProceed: opts.autoProceed,
    restrictions: opts.restrictions ? restrictions : defaultNullRestrictions,
  })

  window.uppy.getPlugin('Dashboard').setOptions({
    note: opts.restrictions ? 'Images and video only, 2–3 files, up to 1 MB' : '',
    theme: opts.darkMode ? 'dark' : 'light',
    disabled: opts.disabled,
  })

  const googleDriveInstance = window.uppy.getPlugin('GoogleDrive')
  if (opts.GoogleDrive && !googleDriveInstance) {
    window.uppy.use(GoogleDrive, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.GoogleDrive && googleDriveInstance) {
    window.uppy.removePlugin(googleDriveInstance)
  }

  const dropboxInstance = window.uppy.getPlugin('Dropbox')
  if (opts.Dropbox && !dropboxInstance) {
    window.uppy.use(Dropbox, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Dropbox && dropboxInstance) {
    window.uppy.removePlugin(dropboxInstance)
  }

  const instagramInstance = window.uppy.getPlugin('Instagram')
  if (opts.Instagram && !instagramInstance) {
    window.uppy.use(Instagram, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Instagram && instagramInstance) {
    window.uppy.removePlugin(instagramInstance)
  }

  const urlInstance = window.uppy.getPlugin('Url')
  if (opts.Url && !urlInstance) {
    window.uppy.use(Url, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Url && urlInstance) {
    window.uppy.removePlugin(urlInstance)
  }

  const facebookInstance = window.uppy.getPlugin('Facebook')
  if (opts.Facebook && !facebookInstance) {
    window.uppy.use(Facebook, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Facebook && facebookInstance) {
    window.uppy.removePlugin(facebookInstance)
  }

  const oneDriveInstance = window.uppy.getPlugin('OneDrive')
  if (opts.OneDrive && !oneDriveInstance) {
    window.uppy.use(OneDrive, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.OneDrive && oneDriveInstance) {
    window.uppy.removePlugin(oneDriveInstance)
  }
  const unsplashInstance = window.uppy.getPlugin('Unsplash')
  if (opts.Unsplash && !unsplashInstance) {
    window.uppy.use(Unsplash, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Unsplash && unsplashInstance) {
    window.uppy.removePlugin(unsplashInstance)
  }

  const zoomInstance = window.uppy.getPlugin('Zoom')
  if (opts.Zoom && !zoomInstance) {
    window.uppy.use(Zoom, { target: Dashboard, companionUrl: 'https://intense-meadow-61813.herokuapp.com/' })
  }
  if (!opts.Zoom && zoomInstance) {
    window.uppy.removePlugin(zoomInstance)
  }

  const boxInstance = window.uppy.getPlugin('Box')
  if (opts.Box && !boxInstance) {
    window.uppy.use(Box, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Box && boxInstance) {
    window.uppy.removePlugin(boxInstance)
  }

  const webcamInstance = window.uppy.getPlugin('Webcam')
  if (opts.Webcam && !webcamInstance) {
    window.uppy.use(Webcam, {
      target: Dashboard,
      showVideoSourceDropdown: true,
    })
  }
  if (!opts.Webcam && webcamInstance) {
    window.uppy.removePlugin(webcamInstance)
  }

  const audioInstance = window.uppy.getPlugin('Audio')
  if (opts.Audio && !audioInstance) {
    window.uppy.use(Audio, {
      target: Dashboard,
      showAudioSourceDropdown: true,
    })
  }
  if (!opts.Audio && audioInstance) {
    window.uppy.removePlugin(audioInstance)
  }

  const screenCaptureInstance = window.uppy.getPlugin('ScreenCapture')
  if (opts.ScreenCapture && !screenCaptureInstance) {
    window.uppy.use(ScreenCapture, { target: Dashboard })
  }
  if (!opts.ScreenCapture && screenCaptureInstance) {
    window.uppy.removePlugin(screenCaptureInstance)
  }

  const imageEditorInstance = window.uppy.getPlugin('ImageEditor')
  if (opts.imageEditor && !imageEditorInstance) {
    window.uppy.use(ImageEditor, { target: Dashboard })
  }
  if (!opts.imageEditor && imageEditorInstance) {
    window.uppy.removePlugin(imageEditorInstance)
  }

  const dropTargetInstance = window.uppy.getPlugin('DropTarget')
  if (opts.DropTarget && !dropTargetInstance) {
    window.uppy.use(DropTarget, { target: document.body })
  }
  if (!opts.DropTarget && dropTargetInstance) {
    window.uppy.removePlugin(dropTargetInstance)
  }

  const goldenRetrieverInstance = window.uppy.getPlugin('GoldenRetriever')
  if (opts.GoldenRetriever && !goldenRetrieverInstance) {
    window.uppy.use(GoldenRetriever)
  }
  if (!opts.GoldenRetriever && goldenRetrieverInstance) {
    window.uppy.removePlugin(goldenRetrieverInstance)
  }

  const compressorInstance = window.uppy.getPlugin('Compressor')
  if (opts.Compressor && !compressorInstance) {
    window.uppy.use(Compressor)
  }
  if (!opts.Compressor && compressorInstance) {
    window.uppy.removePlugin(compressorInstance)
  }
}

function whenLocaleAvailable (localeName, callback) {
  const interval = 100 // ms
  const loop = setInterval(() => {
    if (window.Uppy && window.Uppy.locales && window.Uppy.locales[localeName]) {
      clearInterval(loop)
      callback(window.Uppy.locales[localeName])
    }
  }, interval)
}

function loadLocaleFromCDN (localeName) {
  const head = document.getElementsByTagName('head')[0]
  const js = document.createElement('script')
  js.type = 'text/javascript'
  js.src = `https://releases.transloadit.com/uppy/locales/v2.0.8/${localeName}.min.js`

  head.appendChild(js)
}

function setLocale (localeName) {
  if (typeof window.Uppy.locales[localeName] === 'undefined') {
    loadLocaleFromCDN(localeName)
  }
  whenLocaleAvailable(localeName, (localeObj) => {
    const direction = RTL_LOCALES.indexOf(localeName) !== -1
      ? 'rtl'
      : 'ltr'

    window.uppy.setOptions({
      locale: localeObj,
    })

    window.uppy.getPlugin('Dashboard').setOptions({
      direction,
    })
  })
}

function populateLocaleSelect () {
  const localeSelect = document.getElementById('localeList')

  Object.keys(localeList).forEach(localeName => {
    if (localeName === 'en_US') return
    localeSelect.innerHTML += `<option value="${localeName}">${localeList[localeName]} — (${localeName})</option>`
  })

  localeSelect.addEventListener('change', (event) => {
    const localeName = event.target.value
    setLocale(localeName)
  })
}

window.uppySetOptions = uppySetOptions
window.uppyInit = uppyInit
window.uppySetLocale = setLocale

populateLocaleSelect()
uppyInit()
uppySetOptions()
