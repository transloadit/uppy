'use client'

import React, { useState } from 'react'
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import Webcam from '@uppy/webcam'
import { Dashboard } from '@uppy/react'
import Xhr from '@uppy/xhr-upload'


import '@uppy/core/dist/style.min.css'
import '@uppy/dashboard/dist/style.min.css'
import '@uppy/webcam/dist/style.min.css'

const UppyDashboard: React.FC = () => {
  const [uppy] = useState(() => new Uppy().use(Tus, { endpoint: '/api/tus' }).use(Webcam))
  const [uppyXhr] = useState(() => new Uppy().use(Xhr, { endpoint: '/api/xhr' }).use(Webcam))


  return (
    <div>
      <h2>Tus Example</h2>
      <Dashboard
        uppy={uppy}
        plugins={['Webcam']}
      />
      <h2>XHR Example</h2>
      <Dashboard
        uppy={uppyXhr}
        plugins={['Webcam']}
      />
    </div>

  )
}

export default UppyDashboard