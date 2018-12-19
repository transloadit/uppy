import Expo from 'expo'

function selectImageWithExpo (options) {
  return new Promise((resolve, reject) => {
    return Expo.Permissions.askAsync(Expo.Permissions.CAMERA_ROLL)
      .then((isAllowed) => {
        if (!isAllowed) {
          return reject(new Error('Permissions denied'))
        }

        return Expo.ImagePicker.launchImageLibraryAsync(options)
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
