import { useState } from "react";
import type { MetaFunction } from "react-router";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import Xhr from "@uppy/xhr-upload";

export const meta: MetaFunction = () => [
  { title: "React Router + Uppy Upload Examples" },
  { name: "description", content: "Minimal Uppy upload examples (TUS & XHR) with React Router" },
];

function createTusUppy() {
  return new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxNumberOfFiles: 5,
    },
  }).use(Tus, { endpoint: "/api/upload" });
}

function createXhrUppy() {
  return new Uppy({
    restrictions: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxNumberOfFiles: 3,
    },
  }).use(Xhr, {
    endpoint: "/upload",
    method: "POST",
    fieldName: "files",
    allowedMetaFields: [],
  });
}

export default function Index() {
  const [tusUppy] = useState(createTusUppy);
  const [xhrUppy] = useState(createXhrUppy);

  return (
    <main style={{
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      maxWidth: "900px",
      margin: "0 auto"
    }}>
      <h1>React Router + Uppy Upload Examples</h1>
      <p style={{ color: "#666", marginBottom: "3rem" }}>
        Two upload methods: TUS (resumable) via Express middleware, and XHR via React Router resource routes.
      </p>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "#333", fontSize: "1.5rem", marginBottom: "1rem" }}>
          🔄 TUS Resumable Upload
        </h2>
        <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Uses Express middleware with <code>@tus/server</code>. Supports resumable uploads for large files.
        </p>
        <Dashboard
          uppy={tusUppy}
          height={250}
          note="TUS: Upload up to 5 files, max 50MB each (resumable)"
        />
      </section>

      <section>
        <h2 style={{ color: "#333", fontSize: "1.5rem", marginBottom: "1rem" }}>
          ⚡ XHR Upload
        </h2>
        <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Uses React Router's native resource routes with <code>@mjackson/file-storage</code>. Standard HTTP uploads.
        </p>
        <Dashboard
          uppy={xhrUppy}
          height={250}
          note="XHR: Upload up to 3 files, max 10MB each"
        />
      </section>
    </main>
  );
}
