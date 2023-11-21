import * as ImagePicker from 'expo-image-picker'

function takePictureWithExpo () {
  return ImagePicker.getCameraPermissionsAsync()
    .then(({ granted }) => (granted
      ? ImagePicker.launchCameraAsync({ allowsEditing: true })
      : Promise.reject(new Error('Permissions denied'))))
    .then((result) => (!result.cancelled
      ? result
      : Promise.reject(new Error('Operation cancelled'))))
}

export default takePictureWithExpo
