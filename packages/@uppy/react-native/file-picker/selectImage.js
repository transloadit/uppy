import * as ImagePicker from 'expo-image-picker'

function selectImageWithExpo (options) {
  // No permissions request is necessary for launching the image library
  return ImagePicker.launchImageLibraryAsync(options)
}

export default selectImageWithExpo
