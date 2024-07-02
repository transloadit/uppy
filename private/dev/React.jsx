/* eslint-disable react/react-in-jsx-scope, import/no-extraneous-dependencies */
// eslint-disable-next-line no-unused-vars
import { createElement as h, useState, useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved
import { createRoot } from 'react-dom/client';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

import { Dashboard } from '@uppy/react';

import DashboardUppy from './Dashboard.js'


function App() {
  const [uppy] = useState(() => DashboardUppy());

  const [i, setI] = useState(0);

  // https://github.com/transloadit/uppy/issues/5248
  const handleDoneButtonClick = useCallback(() => {
    setI(i + 1);
    console.log('Done button clicked', i);
  }, [i]);

  return (
    <div>
      <h1>React Uppy</h1>
      <Dashboard uppy={uppy} doneButtonHandler={handleDoneButtonClick} />
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
