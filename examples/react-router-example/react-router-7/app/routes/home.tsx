import { useState } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/lib/Dashboard";
import Tus from "@uppy/tus";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

function createUppy() {
  return new Uppy().use(Tus, { endpoint: "/upload" });
}

export default function Home() {
  // Important: use an initializer function to prevent the state from recreating.
  const [uppy] = useState(createUppy);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1>Uppy Dashboard with React Router 7</h1>
        <p>
          This example demonstrates how to use Uppy with React Router 7 resource routes and TUS uploads.
          Files will be uploaded using the TUS resumable upload protocol via resource routes.
        </p>
        
        <div style={{ marginTop: "2rem" }}>
          <Dashboard theme="dark" uppy={uppy} />
        </div>
        
        <div style={{ marginTop: "2rem", fontSize: "14px", color: "#666" }}>
          <p>
            <strong>React Router 7 Features:</strong>
          </p>
          <ul>
            <li>Resource routes for TUS upload handling</li>
            <li>Server-side rendering (SSR)</li>
            <li>Type-safe routing</li>
            <li>File-based route configuration</li>
            <li>Built-in error boundaries</li>
          </ul>
          
          <p>
            <strong>Upload Implementation:</strong> The TUS protocol is handled by the <code>/upload</code> resource route,
            eliminating the need for a separate server.
          </p>
        </div>
      </div>
    </div>
  );
}
