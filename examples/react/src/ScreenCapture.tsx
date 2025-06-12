/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable react/button-has-type */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import { useEffect } from 'react';
import { useScreenCapture } from '@uppy/react';

interface ScreenCaptureProps {
  isOpen: boolean;
  close: () => void;
}

function ScreenCapture({ isOpen, close }: ScreenCaptureProps) {
  const {
    start,
    stop,
    getVideoProps,
    getScreenshotButtonProps,
    getRecordButtonProps,
    getStopRecordingButtonProps,
    getSubmitButtonProps,
    getDiscardButtonProps,
  } = useScreenCapture({ onSubmit: close });

  useEffect(() => {
    if (isOpen) {
      start();
    }

    return () => {
      stop();
    };
  }, [start, stop, isOpen]);

//   const renderError = () => {
//     if (state.status === 'error') {
//       let errorMessage = 'An unknown screen capture error occurred.';
//       if (state.screenCaptureError?.message) {
//         errorMessage = `Screen capture error: ${state.screenCaptureError.message}`;
//       }
//       return (
//         <div className="p-4 my-2 text-red-700 bg-red-100 border border-red-400 rounded">
//           <p className="font-bold">Error</p>
//           <p>{errorMessage}</p>
//         </div>
//       );
//     }
//     return null;
//   };

  return (
    <div className="p-4 max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Screen Capture</h2>
        <button onClick={close} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      {/* {renderError()} */}
      <video
        className="border-2 w-full rounded-lg data-[uppy-mirrored=true]:scale-x-[-1]"
        {...getVideoProps()}
      />
      <div className="flex gap-4 mt-4">
        <button
          {...getScreenshotButtonProps()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-blue-300"
        >
          Snapshot
        </button>
        <button
          {...getRecordButtonProps()}
          className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-green-300"
        >
          Record
        </button>
        <button
          {...getStopRecordingButtonProps()}
          className="bg-red-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-red-300"
        >
          Stop
        </button>
        <button
          {...getSubmitButtonProps()}
          className="bg-purple-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-purple-300"
        >
          Submit
        </button>
        <button
          {...getDiscardButtonProps()}
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:bg-gray-300"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

export default ScreenCapture;
