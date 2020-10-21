import * as DocumentPicker from 'expo-document-picker'

function selectDocumentWithExpo (options) {
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false
  }).then((result) => {
    if (!result.cancelled && result.type !== 'cancel') {
      return result
    }
  })
}

export default selectDocumentWithExpo
