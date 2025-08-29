# React Router Express + Uppy Example

This example demonstrates how to integrate Uppy file uploads with React Router using the Express adapter and TUS server for resumable uploads.

## Features

- **React Router**: Modern React framework with Express adapter
- **TUS Resumable Uploads**: Reliable file uploads that can resume after interruptions
- **Express Integration**: Custom server handling both React Router and file uploads
- **TypeScript**: Full type safety

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Production

```bash
npm run build
npm start
```

## How It Works

### Server Architecture

The Express server handles both TUS uploads and React Router requests:

```javascript
// Handle TUS uploads before React Router
app.all("/api/upload/*", (req, res) => {
  return tusServer.handle(req, res);
});

// Handle all other routes with React Router
app.all("*", reactRouterHandler);
```

### Client Implementation

The React component uses Uppy's Dashboard with TUS plugin:

```tsx
import { useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";

function createUppy() {
  return new Uppy().use(Tus, { endpoint: "/api/upload" });
}

export default function Index() {
  const [uppy] = useState(createUppy);
  return <Dashboard uppy={uppy} />;
}
```

## File Upload Flow

1. User selects files in the Uppy Dashboard
2. Uppy initiates TUS upload to `/api/upload`
3. Express server routes request to TUS server
4. TUS server handles resumable upload protocol
5. Files are stored in `/uploads` directory
6. Real-time progress updates in the UI

## Configuration

- **Upload directory**: `./uploads` (auto-created)
- **Max file size**: 100MB per file
- **Max files**: 10 files at once
- **TUS endpoint**: `/api/upload`

## Key Benefits

- **Resumable**: Uploads continue after network interruptions
- **Reliable**: TUS protocol ensures data integrity
- **Modern**: Uses latest React Router patterns
- **Minimal**: Simple integration example
