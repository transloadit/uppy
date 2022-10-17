// Using leading underscore so eslint compat plugin doesn't yell at us.
import * as _Permissions from 'expo-permissions' // eslint-disable-line import/no-unresolved
import * as ImagePicker from 'expo-image-picker' // eslint-disable-line import/no-unresolved

function takePictureWithExpo () {
  return _Permissions.askAsync(_Permissions.CAMERA)
    .then((isAllowed) => (isAllowed ? ImagePicker.launchCameraAsync({ allowsEditing: true })
      : Promise.reject(new Error('Permissions denied'))))
    .then((result) => (!result.cancelled ? result
      : Promise.reject(new Error('Operation cancelled'))))
}

export default takePictureWithExpo
