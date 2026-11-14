import { Dropzone, UppyContextProvider } from '@uppy/react'
import { useState } from 'react'
import { Uppy } from 'uppy'

import { BrowserWindow } from './BrowserWindow'

import '@uppy/react/css/style.css'

import styles from './dropzone.module.css'

export default function DropzoneDemo() {
  const [uppy] = useState(() => new Uppy())

  return (
    <BrowserWindow>
      <UppyContextProvider uppy={uppy}>
        <div className={styles.wrapper}>
          <Dropzone />
        </div>
      </UppyContextProvider>
    </BrowserWindow>
  )
}
