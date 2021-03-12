import * as Permissions from 'expo-permissions'
import * as ImagePicker from 'expo-image-picker'

function takePictureWithExpo (options) {
  return new Promise((resolve, reject) => {
    // This is a different `Permissions` object than eslint-plugin-compat thinks it is
    // eslint-disable-next-line compat/compat
    return Permissions.askAsync(Permissions.CAMERA).then((isAllowed) => {
      if (!isAllowed) {
        return reject(new Error('Permissions denied'))
      }

      return ImagePicker.launchCameraAsync({ allowsEditing: true })
        .then((result) => {
          if (!result.cancelled) {
            return resolve(result)
          }
        })
    })
  })
}

export default takePictureWithExpo
