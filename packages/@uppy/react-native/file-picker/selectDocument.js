import * as DocumentPicker from 'expo-document-picker' // eslint-disable-line import/no-unresolved

function selectDocumentWithExpo () {
  return DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: false,
  }).then((result) => {
    if (!result.cancelled && result.type !== 'cancel') {
      return result
    }
    return undefined
  })
}

export default selectDocumentWithExpo
