import * as DocumentPicker from 'expo-document-picker'

function selectDocumentWithExpo () {
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false,
  }).then((result) => {
    if (!result.cancelled && result.type !== 'cancel') {
      return result
    }
  })
}

export default selectDocumentWithExpo
