import { useState } from "react";
import type { MetaFunction } from "react-router";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";

export const meta: MetaFunction = () => {
  return [
    { title: "React Router + Uppy Example" },
    { name: "description", content: "File upload with React Router and Uppy!" },
  ];
};

function createUppy() {
  return new Uppy({
    debug: true,
    restrictions: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxNumberOfFiles: 10,
    },
  }).use(Tus, {
    endpoint: "/api/upload",
    retryDelays: [0, 1000, 3000, 5000],
  });
}

export default function Index() {
  // Important: use an initializer function to prevent the state from recreating
  const [uppy] = useState(createUppy);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>React Router + Uppy File Upload</h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        This example shows how to integrate Uppy file uploads with React Router using an Express server with TUS support.
      </p>

      <div style={{ marginBottom: "2rem" }}>
        <h2>TUS Resumable Upload</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          Upload files using the TUS protocol for resumable uploads. Files are saved to the <code>/uploads</code> directory.
        </p>
        <Dashboard
          uppy={uppy}
          height={400}
          hideProgressDetails={false}
          note="Upload up to 10 files, max 100MB each"
        />
      </div>

      <div style={{ padding: "1rem", background: "#f5f5f5", borderRadius: "4px" }}>
        <h3>How it works:</h3>
        <ul>
          <li><strong>Express Server:</strong> Handles TUS uploads at <code>/api/upload</code></li>
          <li><strong>React Router:</strong> Serves the React app for all other routes</li>
          <li><strong>TUS Protocol:</strong> Enables resumable uploads for reliability</li>
          <li><strong>File Storage:</strong> Files saved to local <code>/uploads</code> directory</li>
        </ul>
      </div>
    </div>
  );
}
