/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/button-has-type */
import { useDropzone, useFileInput, ProviderIcon } from '@uppy/react'

export interface CustomDropzoneProps {
  openModal: (plugin: 'webcam' | 'dropbox' | 'screen-capture') => void
}

export function CustomDropzone({ openModal }: CustomDropzoneProps) {
  const { getRootProps, getInputProps } = useDropzone({ noClick: true })
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()

  return (
    <div>
      <input {...getInputProps()} className="hidden" />
      <div
        {...getRootProps()}
        role="button"
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
        </div>
      </div>
    </div>
  )
}

export default CustomDropzone
