require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const GoogleDrive = require('@uppy/google-drive')
const Dropbox = require('@uppy/dropbox')
const Instagram = require('@uppy/instagram')
const Facebook = require('@uppy/facebook')
const OneDrive = require('@uppy/onedrive')
const Url = require('@uppy/url')
const Webcam = require('@uppy/webcam')
const Tus = require('@uppy/tus')
const localeList = require('../locale_list.json')

const COMPANION = require('../env')

if (typeof window !== 'undefined' && typeof window.Uppy === 'undefined') {
  window.Uppy = {
    locales: {}
  }
}

function uppyInit () {
  if (window.uppy) {
    window.uppy.close()
  }

  const opts = window.uppyOptions

  const uppy = Uppy({
    logger: Uppy.debugLogger
  })

  uppy.use(Tus, { endpoint: 'https://master.tus.io/files/', resume: true })

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
    replaceTargetContent: opts.DashboardInline,
    height: 470,
    showProgressDetails: true,
    metaFields: [
      { id: 'name', name: 'Name', placeholder: 'file name' },
      { id: 'caption', name: 'Caption', placeholder: 'add description' }
    ]
  })

  window.uppy = uppy
}

function uppySetOptions () {
  const opts = window.uppyOptions

  const defaultNullRestrictions = {
    maxFileSize: null,
    maxNumberOfFiles: null,
    minNumberOfFiles: null,
    allowedFileTypes: null
  }

  const restrictions = {
    maxFileSize: 1000000,
    maxNumberOfFiles: 3,
    minNumberOfFiles: 2,
    allowedFileTypes: ['image/*', 'video/*']
  }

  window.uppy.setOptions({
    autoProceed: opts.autoProceed,
    restrictions: opts.restrictions ? restrictions : defaultNullRestrictions
  })

  window.uppy.getPlugin('Dashboard').setOptions({
    note: opts.restrictions ? 'Images and video only, 2–3 files, up to 1 MB' : '',
    browserBackButtonClose: opts.browserBackButtonClose
  })

  const GoogleDriveInstance = window.uppy.getPlugin('GoogleDrive')
  if (opts.GoogleDrive && !GoogleDriveInstance) {
    window.uppy.use(GoogleDrive, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.GoogleDrive && GoogleDriveInstance) {
    window.uppy.removePlugin(GoogleDriveInstance)
  }

  const DropboxInstance = window.uppy.getPlugin('Dropbox')
  if (opts.Dropbox && !DropboxInstance) {
    window.uppy.use(Dropbox, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Dropbox && DropboxInstance) {
    window.uppy.removePlugin(DropboxInstance)
  }

  const InstagramInstance = window.uppy.getPlugin('Instagram')
  if (opts.Instagram && !InstagramInstance) {
    window.uppy.use(Instagram, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Instagram && InstagramInstance) {
    window.uppy.removePlugin(InstagramInstance)
  }

  const UrlInstance = window.uppy.getPlugin('Url')
  if (opts.Url && !UrlInstance) {
    window.uppy.use(Url, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Url && UrlInstance) {
    window.uppy.removePlugin(UrlInstance)
  }

  const FacebookInstance = window.uppy.getPlugin('Facebook')
  if (opts.Facebook && !FacebookInstance) {
    window.uppy.use(Facebook, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Facebook && FacebookInstance) {
    window.uppy.removePlugin(FacebookInstance)
  }

  const OneDriveInstance = window.uppy.getPlugin('OneDrive')
  if (opts.OneDrive && !OneDriveInstance) {
    window.uppy.use(OneDrive, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.OneDrive && OneDriveInstance) {
    window.uppy.removePlugin(OneDriveInstance)
  }

  const WebcamInstance = window.uppy.getPlugin('Webcam')
  if (opts.Webcam && !WebcamInstance) {
    window.uppy.use(Webcam, { target: Dashboard, companionUrl: COMPANION })
  }
  if (!opts.Webcam && WebcamInstance) {
    window.uppy.removePlugin(WebcamInstance)
  }
}

function whenLocaleAvailable (localeName, callback) {
  var interval = 100 // ms
  var loop = setInterval(function () {
    if (window.Uppy && window.Uppy.locales && window.Uppy.locales[localeName]) {
      clearInterval(loop)
      callback(window.Uppy.locales[localeName])
    }
  }, interval)
}

function loadLocaleFromCDN (localeName) {
  var head = document.getElementsByTagName('head')[0]
  var js = document.createElement('script')
  js.type = 'text/javascript'
  js.src = `https://transloadit.edgly.net/releases/uppy/locales/v1.11.2/${localeName}.min.js`

  head.appendChild(js)
}

function setLocale (localeName) {
  if (typeof window.Uppy.locales[localeName] === 'undefined') {
    loadLocaleFromCDN(localeName)
  }
  whenLocaleAvailable(localeName, (localeObj) => {
    window.uppy.setOptions({
      locale: localeObj
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
