const remoteProviders = {
  dropbox: require('@uppy/dropbox'),
  'google-drive': require('@uppy/google-drive'),
  instagram: require('@uppy/instagram'),
  url: require('@uppy/url')
}

const localProviders = {
  webcam: require('@uppy/webcam')
}

const remoteProviderOptionNames = [
  'serverUrl',
  'serverPattern',
  'serverHeaders',
  'target'
]

// No shared options.
const localProviderOptionNames = [
  'target'
]

function addRemoteProvider (uppy, name, opts) {
  const Provider = remoteProviders[name]
  const providerOptions = {}
  remoteProviderOptionNames.forEach((name) => {
    if (opts.hasOwnProperty(name)) providerOptions[name] = opts[name]
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
    if (opts.hasOwnProperty(name)) providerOptions[name] = opts[name]
  })
  // Apply overrides for a specific provider plugin.
  if (typeof opts[name] === 'object') {
    Object.assign(providerOptions, opts[name])
  }
  uppy.use(Provider, providerOptions)
}

function addProviders (uppy, names, opts = {}) {
  names.forEach((name) => {
    if (remoteProviders.hasOwnProperty(name)) {
      addRemoteProvider(uppy, name, opts)
    } else if (localProviders.hasOwnProperty(name)) {
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
