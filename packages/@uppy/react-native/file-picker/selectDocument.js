import * as Expo from 'expo'

function selectDocumentWithExpo (options) {
  return Expo.DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false
  }).then((result) => {
    if (!result.cancelled && result.type !== 'cancel') {
      return result
    }
  })
}

export default selectDocumentWithExpo
