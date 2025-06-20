/* eslint-disable react/jsx-props-no-spreading, react/button-has-type */
/* eslint-disable react/react-in-jsx-scope */
import React from 'react'

type ButtonProps = {
  type: 'button'
  onClick: () => void
  disabled: boolean
}

export interface MediaCaptureProps {
  title: string
  close: () => void
  getVideoProps: () => Record<string, unknown>
  getPrimaryActionButtonProps: () => ButtonProps
  primaryActionButtonLabel: string
  getRecordButtonProps: () => ButtonProps
  getStopRecordingButtonProps: () => ButtonProps
  getSubmitButtonProps: () => ButtonProps
  getDiscardButtonProps: () => ButtonProps
}

export function MediaCapture({
  title,
  close,
  getVideoProps,
  getPrimaryActionButtonProps,
  primaryActionButtonLabel,
  getRecordButtonProps,
  getStopRecordingButtonProps,
  getSubmitButtonProps,
  getDiscardButtonProps,
}: MediaCaptureProps) {
  return (
    <div className="p-4 max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          type="button"
          onClick={close}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <video
        className="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
        {...getVideoProps()}
      >
        <track kind="captions" />
      </video>
      <div className="flex gap-4 flex-wrap mt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
          {...getPrimaryActionButtonProps()}
        >
          {primaryActionButtonLabel}
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
          {...getRecordButtonProps()}
        >
          Record
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
          {...getStopRecordingButtonProps()}
        >
          Stop
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
          {...getSubmitButtonProps()}
        >
          Submit
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
          {...getDiscardButtonProps()}
        >
          Discard
        </button>
      </div>
    </div>
  )
}

export default MediaCapture
