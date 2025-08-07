import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/react/lib/Dashboard';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

function createUppy() {
  return new Uppy().use(Tus, { endpoint: '/api/upload' });
}

function UppyDashboard() {
  // Important: use an initializer function to prevent the state from recreating.
  const [uppy] = useState(createUppy);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1>Uppy Dashboard with React Router 7</h1>
        <p>
          This example demonstrates how to use Uppy with React Router and TUS uploads.
          Files will be uploaded using the TUS resumable upload protocol.
        </p>
        
        <nav style={{ marginBottom: "2rem" }}>
          <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
          <Link to="/about">About</Link>
        </nav>
        
        <div style={{ marginTop: "2rem" }}>
          <Dashboard theme="dark" uppy={uppy} />
        </div>
        
        <div style={{ marginTop: "2rem", fontSize: "14px", color: "#666" }}>
          <p>
            <strong>Features:</strong>
          </p>
          <ul>
            <li>Resumable uploads with TUS protocol</li>
            <li>React Router navigation</li>
            <li>Dark theme dashboard</li>
            <li>File drag and drop support</li>
          </ul>
          
          <p>
            <strong>Upload Endpoint:</strong> The example expects a TUS server running at <code>/api/upload</code>.
            You can use a simple TUS server or implement your own resource routes.
          </p>
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1>About</h1>
        <nav style={{ marginBottom: "2rem" }}>
          <Link to="/" style={{ marginRight: "1rem" }}>Home</Link>
          <Link to="/about">About</Link>
        </nav>
        <p>
          This example demonstrates React Router 7 patterns with Uppy file uploads.
          The goal is to show how to integrate file uploads in a modern React Router application
          using the TUS resumable upload protocol.
        </p>
        <h2>Technologies Used</h2>
        <ul>
          <li><strong>React Router 7:</strong> Modern routing for React applications</li>
          <li><strong>Uppy:</strong> Modular file uploader</li>
          <li><strong>TUS:</strong> Resumable upload protocol</li>
          <li><strong>TypeScript:</strong> Type-safe development</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UppyDashboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;