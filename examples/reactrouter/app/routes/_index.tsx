import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'
import Transloadit from '@uppy/transloadit'
import Tus from '@uppy/tus'
import Xhr from '@uppy/xhr-upload'
import { useState } from 'react'
import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => [
  { title: 'React Router + Uppy Upload Examples' },
  {
    name: 'description',
    content: 'Minimal Uppy upload examples (TUS & XHR) with React Router',
  },
]

function createTusUppy() {
  return new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxNumberOfFiles: 5,
    },
  }).use(Tus, { endpoint: '/api/upload/tus' })
}

function createXhrUppy() {
  return new Uppy({
    restrictions: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxNumberOfFiles: 3,
    },
  }).use(Xhr, {
    endpoint: '/api/upload/xhr',
    method: 'POST',
    fieldName: 'files',
    allowedMetaFields: [],
  })
}

function createTransloaditUppy() {
  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxNumberOfFiles: 10,
    },
  })

  uppy.use(Transloadit, {
    async assemblyOptions() {
      // You can send meta data along for use in your template.
      // https://transloadit.com/docs/topics/assembly-instructions/#form-fields-in-instructions
      const { meta } = uppy.getState()
      const body = JSON.stringify({
        customValue: meta.customValue || 'react-router-uppy-example',
      })
      const res = await fetch('/api/transloadit-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        if (errorData.details) {
          throw new Error(errorData.details)
        }
        throw new Error(`Failed to get Transloadit params: ${res.statusText}`)
      }
      return res.json()
    },
  })

  return uppy
}

export default function Index() {
  const [tusUppy] = useState(createTusUppy)
  const [xhrUppy] = useState(createXhrUppy)
  const [transloaditUppy] = useState(createTransloaditUppy)

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1>React Router + Uppy Upload Examples</h1>
      <p style={{ color: '#666', marginBottom: '3rem' }}>
        Three upload methods: TUS (resumable), XHR (standard), and Transloadit
        (with processing).
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
          🔄 TUS Resumable Upload
        </h2>
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Uses Express middleware with <code>@tus/server</code>. Supports
          resumable uploads for large files.
        </p>
        <Dashboard
          uppy={tusUppy}
          height={250}
          note="TUS: Upload up to 5 files, max 50MB each (resumable)"
        />
      </section>

      <section>
        <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
          ⚡ XHR Upload
        </h2>
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Uses React Router's native resource routes with{' '}
          <code>@mjackson/file-storage</code>. Standard HTTP uploads.
        </p>
        <Dashboard
          uppy={xhrUppy}
          height={250}
          note="XHR: Upload up to 3 files, max 10MB each"
        />
      </section>

      <section>
        <h2 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '1rem' }}>
          ⚙️ Transloadit Upload & Processing
        </h2>
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Uses Transloadit for uploads with powerful processing capabilities.{' '}
          <strong>Requires environment variables</strong> - see README for
          setup.
        </p>
        <Dashboard
          uppy={transloaditUppy}
          height={250}
          note="Transloadit: Upload up to 10 files, max 100MB each (with processing)"
        />
      </section>
    </main>
  )
}
