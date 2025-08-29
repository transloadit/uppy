import { useState } from "react";
import type { MetaFunction } from "react-router";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";

export const meta: MetaFunction = () => [
  { title: "React Router + Uppy TUS Example" },
  { name: "description", content: "Minimal Uppy TUS upload example with React Router" },
];

function createUppy() {
  return new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxNumberOfFiles: 5,
    },
  }).use(Tus, { endpoint: "/api/upload" });
}

export default function Index() {
  const [uppy] = useState(createUppy);

  return (
    <main style={{
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <h1>React Router + Uppy TUS Example</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Minimal example of Uppy Dashboard with TUS resumable uploads in React Router.
      </p>

      <Dashboard
        uppy={uppy}
        height={300}
        note="Upload up to 5 files, max 50MB each"
      />
    </main>
  );
}
