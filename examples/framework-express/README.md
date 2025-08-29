# React Router v7 + Uppy Upload Examples

**Complete showcase** of Uppy Dashboard with both TUS (resumable) and XHR uploads in React Router v7 framework mode.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore both upload methods:
- **TUS uploads**: Resumable, perfect for large files
- **XHR uploads**: Standard HTTP, ideal for regular files

## What You'll Learn

This example demonstrates **two upload approaches** with Uppy in React Router v7:

1. **TUS server setup** with Express middleware for resumable uploads
2. **XHR uploads** using React Router's native resource routes
3. **File storage** with proper error handling
4. **Uppy Dashboard components** for both upload types

## Key Files

### `server.ts` - Express + TUS + React Router
```typescript
// Handle TUS uploads before React Router
app.all("/api/upload", (req, res) => tusServer.handle(req, res));
app.all("/api/upload/*", (req, res) => tusServer.handle(req, res));

// React Router handles everything else (including XHR uploads)
app.all("*", reactRouterHandler);
```

### `app/routes/_index.tsx` - Dual Upload Dashboard
```tsx
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import Xhr from "@uppy/xhr-upload";

function createTusUppy() {
  return new Uppy().use(Tus, { endpoint: "/api/upload" });
}

function createXhrUppy() {
  return new Uppy().use(Xhr, { endpoint: "/upload" });
}

export default function Index() {
  const [tusUppy] = useState(createTusUppy);
  const [xhrUppy] = useState(createXhrUppy);

  return (
    <>
      <Dashboard uppy={tusUppy} note="TUS: Resumable uploads" />
      <Dashboard uppy={xhrUppy} note="XHR: Standard uploads" />
    </>
  );
}
```

### `app/routes/upload/route.ts` - XHR Upload Resource Route
```tsx
import { LocalFileStorage } from '@mjackson/file-storage/local';
import { parseFormData } from '@mjackson/form-data-parser';

const fileStorage = new LocalFileStorage('./uploads');

export async function action({ request }: ActionFunctionArgs) {
  const uploadHandler = async (fileUpload: FileUpload) => {
    const filename = `${Date.now()}-${fileUpload.name}`;
    await fileStorage.set(filename, fileUpload);
    return { filename, size: fileUpload.size, type: fileUpload.type };
  };

  const formData = await parseFormData(request, uploadHandler);
  return Response.json({ success: true });
}
```

### `app/routes.ts` - Route Configuration
```tsx
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("upload", "routes/upload/route.ts"), // XHR upload endpoint
] satisfies RouteConfig;
```

## Upload Methods

### 🔄 TUS Resumable Uploads
- **Best for**: Large files, unreliable connections
- **Endpoint**: `/api/upload` (Express middleware)
- **Features**: Resume interrupted uploads, chunked transfer
- **Storage**: Direct file system via `@tus/file-store`

### ⚡ XHR Standard Uploads
- **Best for**: Regular files, standard web uploads
- **Endpoint**: `/upload` (React Router resource route)
- **Features**: Simple HTTP POST, immediate response
- **Storage**: `@mjackson/file-storage` with form parsing

Perfect foundation for any file upload needs in React Router v7! 🚀
