import * as Expo from 'expo'

function takePictureWithExpo (options) {
  return new Promise((resolve, reject) => {
    return Expo.Permissions.askAsync(Expo.Permissions.CAMERA).then((isAllowed) => {
      if (!isAllowed) {
        return reject(new Error('Permissions denied'))
      }

      return Expo.ImagePicker.launchCameraAsync({ allowsEditing: true })
        .then((result) => {
          if (!result.cancelled) {
            return resolve(result)
          }
        })
    })
  })
}

export default takePictureWithExpo
