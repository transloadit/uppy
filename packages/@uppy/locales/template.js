const en_US = {}

en_US.strings = {}

en_US.pluralize = function (count) {
  if (count === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.en_US = en_US
}

module.exports = en_US
