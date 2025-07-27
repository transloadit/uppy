import React, { useState } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import Webcam from '@uppy/webcam';
import { Dashboard } from '@uppy/react';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';

const UppyDashboard: React.FC = () => {
  const [uppy] = useState(() => new Uppy().use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' }).use(Webcam));

  return (
    <div>
      <h1>Uppy Dashboard with React Router</h1>
      <Dashboard
        uppy={uppy}
        plugins={['Webcam']}
      />
    </div>
  );
};

export default UppyDashboard;