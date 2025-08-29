# React Router + Uppy TUS Example

Minimal example showcasing Uppy Dashboard with TUS resumable uploads in React Router framework mode using Express adapter.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the upload interface.

## What's Included

- **React Router Framework**: Modern full-stack React framework
- **Uppy Dashboard**: File upload UI component
- **TUS Protocol**: Resumable upload server
- **Express Adapter**: Custom server integration

## Code Overview

### Server (`server.js`)
```javascript
// TUS upload endpoints (before React Router)
app.all("/api/upload", (req, res) => tusServer.handle(req, res));
app.all("/api/upload/*", (req, res) => tusServer.handle(req, res));

// React Router handles all other routes
app.all("*", reactRouterHandler);
```

### Client (`app/routes/_index.tsx`)
```tsx
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
  return <Dashboard uppy={uppy} height={300} />;
}
```

## How It Works

1. **Express server** handles TUS uploads at `/api/upload`
2. **React Router** serves the app for all other routes
3. **TUS protocol** enables resumable uploads
4. **Files** are stored in `./uploads` directory

## Production

```bash
npm run build
npm start
```

## Dependencies

- `@react-router/express` - Express adapter for React Router
- `@tus/server` + `@tus/file-store` - TUS resumable upload server
- `@uppy/core` + `@uppy/dashboard` + `@uppy/tus` - Uppy file upload library
