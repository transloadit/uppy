import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import * as tus from 'tus-js-client'

function isCordova() {
  return (
    typeof window !== 'undefined' &&
    // @ts-expect-error may exist
    (typeof window.PhoneGap !== 'undefined' ||
      // @ts-expect-error may exist
      typeof window.Cordova !== 'undefined' ||
      // @ts-expect-error may exist
      typeof window.cordova !== 'undefined')
  )
}

function isReactNative() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.product === 'string' &&
    navigator.product.toLowerCase() === 'reactnative'
  )
}

// We override tus fingerprint to uppy’s `file.id`, since the `file.id`
// now also includes `relativePath` for files added from folders.
// This means you can add 2 identical files, if one is in folder a,
// the other in folder b — `a/file.jpg` and `b/file.jpg`, when added
// together with a folder, will be treated as 2 separate files.
//
// For React Native and Cordova, we let tus-js-client’s default
// fingerprint handling take charge.
export default function getFingerprint<M extends Meta, B extends Body>(
  uppyFile: UppyFile<M, B>,
): tus.UploadOptions['fingerprint'] {
  return (file, options) => {
    if (isCordova() || isReactNative()) {
      return tus.defaultOptions.fingerprint(file, options)
    }

    const uppyFingerprint = ['tus', uppyFile.id, options.endpoint].join('-')

    return Promise.resolve(uppyFingerprint)
  }
}
