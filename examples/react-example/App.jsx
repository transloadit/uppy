/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import GoogleDrive from '@uppy/google-drive';
import Webcam from '@uppy/webcam';
import RemoteSources from '@uppy/remote-sources';
import { Dashboard, DashboardModal, DragDrop, ProgressBar, FileInput } from '@uppy/react';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import '@uppy/drag-drop/dist/style.css';
import '@uppy/file-input/dist/style.css';
import '@uppy/progress-bar/dist/style.css';

const App = () => {
 const [showInlineDashboard, setShowInlineDashboard] = useState(false);
 const [open, setOpen] = useState(false);

 const uppy = new Uppy({ id: 'uppy1', autoProceed: true, debug: true })
    .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
    .use(Webcam)
    .use(RemoteSources, {
      companionUrl: 'https://companion.uppy.io',
      sources: ['GoogleDrive', 'Box', 'Dropbox', 'Facebook', 'Instagram', 'OneDrive', 'Unsplash', 'Zoom', 'Url'],
    });

 const uppy2 = new Uppy({ id: 'uppy2', autoProceed: false, debug: true })
    .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' });

 useEffect(() => {
    return () => {
      uppy.close({ reason: 'unmount' });
      uppy2.close({ reason: 'unmount' });
    };
 }, []);

 const handleModalClick = () => {
    setOpen(!open);
 };

 return (
    <div>
      <h1>React Examples</h1>

      <h2>Inline Dashboard</h2>
      <label>
        <input
          type="checkbox"
          checked={showInlineDashboard}
          onChange={(event) => setShowInlineDashboard(event.target.checked)}
        />
        Show Dashboard
      </label>
      {showInlineDashboard && (
        <Dashboard
          uppy={uppy}
          plugins={['GoogleDrive']}
          metaFields={[
            { id: 'name', name: 'Name', placeholder: 'File name' },
          ]}
        />
      )}

      <h2>Modal Dashboard</h2>
      <div>
        <button onClick={handleModalClick}>
          {open ? 'Close dashboard' : 'Open dashboard'}
        </button>
        <DashboardModal
          uppy={uppy2}
          open={open}
          target={document.body}
          onRequestClose={() => setOpen(false)}
        />
      </div>

      <h2>Drag Drop Area</h2>
      <DragDrop
        uppy={uppy}
        locale={{
          strings: {
            chooseFile: 'Boop a file',
            orDragDrop: 'or yoink it here',
          },
        }}
      />

      <h2>Progress Bar</h2>
      <ProgressBar
        uppy={uppy}
        hideAfterFinish={false}
      />

      <h2>File Input</h2>
      <FileInput
        uppy={uppy}
      />
    </div>
 );
};

export default App;
