import type { UppyFile } from '@uppy/core'
import { useImageEditor } from '@uppy/react'

interface ImageEditorProps {
  file: UppyFile<any, any>
  close: () => void
}

export function ImageEditor({ file, close }: ImageEditorProps) {
  const {
    state,
    getImageProps,
    getSaveButtonProps,
    getCancelButtonProps,
    getRotateButtonProps,
    getFlipHorizontalButtonProps,
    getZoomButtonProps,
    getCropSquareButtonProps,
    getCropLandscapeButtonProps,
    getCropPortraitButtonProps,
    getResetButtonProps,
    getRotationSliderProps,
  } = useImageEditor({ file })

  return (
    <div className="p-4 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Edit Image</h2>
        <button
          type="button"
          onClick={close}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        {/* biome-ignore lint/a11y/useAltText: alt is provided by getImageProps() */}
        <img className="w-full rounded-lg border-2" {...getImageProps()} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Fine Rotation: {state.angle}°
          <input className="w-full mt-1" {...getRotationSliderProps()} />
        </label>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getRotateButtonProps(-90)}
        >
          ↶ -90°
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getRotateButtonProps(90)}
        >
          ↷ +90°
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getFlipHorizontalButtonProps()}
        >
          ⇆ Flip
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getZoomButtonProps(0.1)}
        >
          + Zoom
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getZoomButtonProps(-0.1)}
        >
          - Zoom
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getCropSquareButtonProps()}
        >
          1:1
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getCropLandscapeButtonProps()}
        >
          16:9
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getCropPortraitButtonProps()}
        >
          9:16
        </button>
        <button
          className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          {...getResetButtonProps()}
        >
          Reset
        </button>
      </div>

      <div className="flex gap-4 justify-end">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
          {...getCancelButtonProps()}
        >
          Cancel
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
          {...getSaveButtonProps()}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default ImageEditor
