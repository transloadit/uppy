import * as Expo from 'expo'

function selectDocumentWithExpo (options) {
  return Expo.DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false
  }).then((result) => {
    if (!result.cancelled) {
      return result
    }
  })
}

export default selectDocumentWithExpo
