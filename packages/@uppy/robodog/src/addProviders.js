const Transloadit = require('@uppy/transloadit')
const has = require('@uppy/utils/lib/hasProperty')

const remoteProviders = {
  dropbox: require('@uppy/dropbox'),
  'google-drive': require('@uppy/google-drive'),
  instagram: require('@uppy/instagram'),
  facebook: require('@uppy/facebook'),
  onedrive: require('@uppy/onedrive'),
  url: require('@uppy/url'),
  zoom: require('@uppy/zoom')
}

const localProviders = {
  webcam: require('@uppy/webcam')
}

const remoteProviderOptionNames = [
  'companionUrl',
  'companionAllowedHosts',
  'companionHeaders',
  'serverHeaders',
  'target'
]

// No shared options.
const localProviderOptionNames = [
  'target'
]

function addRemoteProvider (uppy, name, opts) {
  const Provider = remoteProviders[name]
  const providerOptions = {
    // Default to the :tl: Companion servers.
    companionUrl: Transloadit.COMPANION,
    companionAllowedHosts: Transloadit.COMPANION_PATTERN
  }

  remoteProviderOptionNames.forEach((name) => {
    if (has(opts, name)) providerOptions[name] = opts[name]
  })
  // Apply overrides for a specific provider plugin.
  if (typeof opts[name] === 'object') {
    Object.assign(providerOptions, opts[name])
  }

  uppy.use(Provider, providerOptions)
}

function addLocalProvider (uppy, name, opts) {
  const Provider = localProviders[name]
  const providerOptions = {}

  localProviderOptionNames.forEach((name) => {
    if (has(opts, name)) providerOptions[name] = opts[name]
  })
  // Apply overrides for a specific provider plugin.
  if (typeof opts[name] === 'object') {
    Object.assign(providerOptions, opts[name])
  }

  uppy.use(Provider, providerOptions)
}

function addProviders (uppy, names, opts = {}) {
  names.forEach((name) => {
    if (has(remoteProviders, name)) {
      addRemoteProvider(uppy, name, opts)
    } else if (has(localProviders, name)) {
      addLocalProvider(uppy, name, opts)
    } else {
      const validNames = [
        ...Object.keys(remoteProviders),
        ...Object.keys(localProviders)
      ]
      const expectedNameString = validNames
        .sort()
        .map((validName) => `'${validName}'`)
        .join(', ')
      throw new Error(`Unexpected provider '${name}', expected one of [${expectedNameString}]`)
    }
  })
}

module.exports = addProviders
