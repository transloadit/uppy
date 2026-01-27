import {
  createGooglePickerStoreAdapter,
  type GooglePickerType,
} from '@uppy/companion-client'
import type Uppy from '@uppy/core'
import type GoogleDrivePicker from '@uppy/google-drive-picker'
import type GooglePhotosPicker from '@uppy/google-photos-picker'

export function createGooglePickerPluginAdapter(
  uppy: Uppy<any, any>,
  pickerType: GooglePickerType,
) {
  const pluginName =
    pickerType === 'drive' ? 'GoogleDrivePicker' : 'GooglePhotosPicker'
  const plugin = uppy.getPlugin<
    GoogleDrivePicker<any, any> | GooglePhotosPicker<any, any>
  >(pluginName)
  if (!plugin) {
    throw new Error(`${pluginName} plugin is not registered in Uppy instance`)
  }

  const { getPluginState, setPluginState, opts } = plugin

  const {
    companionUrl,
    companionCookiesRule,
    companionHeaders,
    companionKeysParams,
    clientId,
  } = opts

  const apiKey = 'apiKey' in opts ? opts.apiKey : undefined
  const appId = 'appId' in opts ? opts.appId : undefined
  const { requestClientId } = plugin

  return {
    store: createGooglePickerStoreAdapter({
      uppy,
      getPluginState,
      setPluginState,
    }),
    opts: {
      companionUrl,
      companionCookiesRule,
      companionHeaders,
      companionKeysParams,
      clientId,
      apiKey,
      appId,
      requestClientId,
    },
  }
}
