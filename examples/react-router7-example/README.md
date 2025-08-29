# React Router 7 + Uppy Example

This example demonstrates how to integrate [Uppy](https://uppy.io) file uploads with [React Router 7](https://reactrouter.com) using a custom Express server for TUS resumable uploads.

## Features

- **React Router 7**: Modern full-stack React framework
- **TUS Resumable Uploads**: Reliable file uploads that can resume after interruptions
- **Express Integration**: Custom server for handling file uploads
- **TypeScript**: Full type safety throughout the application

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express Server  │────│  File Storage   │
│                 │    │                  │    │                 │
│ • Uppy Dashboard│    │ • TUS Handler    │    │ • /uploads dir  │
│ • React Router  │    │ • React Router   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
npm run build
```

### 3. Start the Server

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

For development with hot reloading:

```bash
npm run dev
```

## How It Works

### Express Server Integration

The example uses React Router's Express adapter to create a custom server that handles both:

1. **TUS uploads** at `/api/upload/*` - handled by `@tus/server`
2. **React Router routes** - handled by React Router's request handler

```javascript
// TUS uploads are handled before React Router
app.all('/api/upload/*', (req, res) => {
  return tusServer.handle(req, res)
})

// All other routes go to React Router
app.all('*', createRequestHandler({
  build: async () => import('./build/server/index.js'),
}))
```

### Client-Side Implementation

The React component uses Uppy's Dashboard with TUS plugin:

```tsx
import { useState } from 'react'
import Uppy from '@uppy/core'
import { Dashboard } from '@uppy/react'
import Tus from '@uppy/tus'

function createUppy() {
  return new Uppy().use(Tus, { endpoint: '/api/upload' })
}

export default function Home() {
  const [uppy] = useState(createUppy)
  return <Dashboard uppy={uppy} />
}
```

## File Upload Flow

1. User selects files in the Uppy Dashboard
2. Uppy initiates TUS upload to `/api/upload`
3. Express server receives request and forwards to TUS server
4. TUS server handles resumable upload logic
5. Files are stored in `/uploads` directory
6. Upload progress is displayed in real-time

## Key Benefits

- **Resumable**: Uploads continue after network interruptions
- **Reliable**: TUS protocol ensures data integrity
- **Scalable**: Can handle large files efficiently
- **Modern**: Uses latest React Router 7 patterns

## Configuration

### Upload Restrictions

The example is configured with the following restrictions:

- **Max file size**: 100MB per file
- **Max files**: 10 files at once
- **Allowed types**: Images, videos, audio, PDFs, text files, and archives

You can modify these in the `createUppy()` function.

### Server Configuration

- **Upload directory**: `./uploads` (created automatically)
- **Port**: 3000 (configurable via `PORT` environment variable)
- **TUS endpoint**: `/api/upload`

## Learn More

- [React Router 7 Documentation](https://reactrouter.com)
- [Uppy Documentation](https://uppy.io/docs/)
- [TUS Protocol](https://tus.io)
- [Express Adapter](https://reactrouter.com/how-to/express-server)
