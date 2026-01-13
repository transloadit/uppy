import {
  ProviderIcon,
  useDropzone,
  useFileInput,
  useGooglePicker,
} from '@uppy/react'

export type CustomDropzonePlugin = 'webcam' | 'dropbox' | 'screen-capture'

export interface CustomDropzoneProps {
  openModal: (plugin: CustomDropzonePlugin) => void
}

const companionUrl = 'http://localhost:3020'
const googlePickerClientId = '' // see GOOGLE_PICKER_CLIENT_ID in dev Dashboard
const googlePickerApiKey = '' // see GOOGLE_PICKER_API_KEY in dev Dashboard
const googlePickerAppId = '' // see GOOGLE_PICKER_APP_ID in dev Dashboard

export function CustomDropzone({ openModal }: CustomDropzoneProps) {
  const { getRootProps, getInputProps } = useDropzone({ noClick: true })
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()

  const googleDrivePicker = useGooglePicker({
    clientId: googlePickerClientId,
    companionUrl: companionUrl,
    apiKey: googlePickerApiKey,
    appId: googlePickerAppId,
    pickerType: 'drive',
  })

  const googlePhotosPicker = useGooglePicker({
    clientId: googlePickerClientId,
    companionUrl: companionUrl,
    pickerType: 'photos',
  })

  return (
    <div>
      <input {...getInputProps()} className="hidden" />
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center justify-center gap-4">
          <input {...getFileInputProps()} className="hidden" />
          <button
            {...getButtonProps()}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="device" fill="#1269cf" />
            </div>
            Device
          </button>

          <button
            type="button"
            onClick={() => openModal('webcam')}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="camera" fill="#02B383" />
            </div>
            Webcam
          </button>

          <button
            type="button"
            onClick={() => openModal('screen-capture')}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="screen-capture" fill="#FF5733" />
            </div>
            Screen Capture
          </button>

          <button
            type="button"
            onClick={() => openModal('dropbox')}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="dropbox" />
            </div>
            Dropbox
          </button>

          <button
            type="button"
            onClick={() => googleDrivePicker.show()}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="googledrive" />
            </div>
            Google Drive
          </button>

          <button
            type="button"
            onClick={() => googlePhotosPicker.show()}
            className="hover:bg-gray-100 transition-colors p-2 rounded-md flex flex-col items-center gap-2 text-sm"
          >
            <div className="bg-white shadow-md rounded-md p-1">
              <ProviderIcon provider="googlephotos" />
            </div>
            Google Photos
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomDropzone
