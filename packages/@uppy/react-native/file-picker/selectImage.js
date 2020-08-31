import * as Permissions from 'expo-permissions'
import * as ImagePicker from 'expo-image-picker'

function selectImageWithExpo (options) {
  return new Promise((resolve, reject) => {
    return Permissions.askAsync(Permissions.CAMERA_ROLL)
      .then((isAllowed) => {
        if (!isAllowed) {
          return reject(new Error('Permissions denied'))
        }

        return ImagePicker.launchImageLibraryAsync(options)
          .then((result) => {
            console.log(result)
            if (!result.cancelled) {
              return resolve(result)
            }
          })
      })
  })
}

export default selectImageWithExpo
