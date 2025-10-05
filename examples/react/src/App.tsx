/** biome-ignore-all lint/nursery/useUniqueElementIds: it's fine */
import Uppy from '@uppy/core';
import {
  Dropzone,
  FilesGrid,
  FilesList,
  UploadButton,
  UppyContextProvider,
} from '@uppy/react';
import UppyRemoteSources from '@uppy/remote-sources';
import UppyScreenCapture from '@uppy/screen-capture';
import Tus from '@uppy/tus';
import UppyWebcam from '@uppy/webcam';
import { useRef, useState } from 'react';

import './app.css';
import '@uppy/react/css/style.css';

function App() {
  // Create multiple independent Uppy instances
  const [uppy1] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam)
      .use(UppyScreenCapture)
      .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' })
  );

  const [uppy2] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam)
      .use(UppyScreenCapture)
      .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' })
  );

  const [uppy3] = useState(() =>
    new Uppy()
      .use(Tus, {
        endpoint: 'https://tusd.tusdemo.net/files/',
      })
      .use(UppyWebcam)
      .use(UppyScreenCapture)
      .use(UppyRemoteSources, { companionUrl: 'http://localhost:3020' })
  );

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold my-4">Uppy Bug Reproduction</h1>
      <p className="mb-6 text-gray-600">
        <strong>Expected:</strong> Files should go to the correct Uppy instance
        when clicking to select files.
        <br />
        <strong>Bug:</strong> Files selected via click always go to the first
        instance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* First Uppy Instance */}
        <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
          <h2 className="text-xl font-bold mb-4 text-blue-800">
            First Uppy Instance
          </h2>
          <UppyContextProvider uppy={uppy1}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Dropzone 1:</h3>
                <Dropzone />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Files in Instance 1:
                </h3>
                <FilesGrid columns={1} />
              </div>
              <UploadButton />
            </div>
          </UppyContextProvider>
        </div>

        {/* Second Uppy Instance */}
        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
          <h2 className="text-xl font-bold mb-4 text-green-800">
            Second Uppy Instance
          </h2>
          <UppyContextProvider uppy={uppy2}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Dropzone 2:</h3>
                <Dropzone />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Files in Instance 2:
                </h3>
                <FilesGrid columns={1} />
              </div>
              <UploadButton />
            </div>
          </UppyContextProvider>
        </div>

        {/* Third Uppy Instance */}
        <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
          <h2 className="text-xl font-bold mb-4 text-purple-800">
            Third Uppy Instance
          </h2>
          <UppyContextProvider uppy={uppy3}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Dropzone 3:</h3>
                <Dropzone />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Files in Instance 3:
                </h3>
                <FilesGrid columns={1} />
              </div>
              <UploadButton />
            </div>
          </UppyContextProvider>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
        <h3 className="text-lg font-bold mb-2">How to reproduce the bug:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>Drag and drop test (this should work correctly):</strong>
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>
                Drag a file onto "Dropzone 2" → file should appear in "Files in
                Instance 2" ✅
              </li>
              <li>
                Drag a file onto "Dropzone 3" → file should appear in "Files in
                Instance 3" ✅
              </li>
            </ul>
          </li>
          <li>
            <strong>
              Click to select test (this is where the bug occurs):
            </strong>
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>
                Click on "Dropzone 2" and select a file → file incorrectly
                appears in "Files in Instance 1" ❌
              </li>
              <li>
                Click on "Dropzone 3" and select a file → file incorrectly
                appears in "Files in Instance 1" ❌
              </li>
            </ul>
          </li>
        </ol>
        <p className="mt-3 text-sm text-gray-700">
          The bug is that clicking any dropzone always adds files to the first
          Uppy instance, regardless of which dropzone was clicked.
        </p>
      </div>
    </div>
  );
}

export default App;
