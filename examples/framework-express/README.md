# React Router v7 + Uppy Upload Examples

**Complete showcase** of Uppy Dashboard with TUS (resumable), XHR (standard), and Transloadit (with processing) uploads in React Router v7 framework mode.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore three upload methods:
- **TUS uploads**: Resumable, perfect for large files
- **XHR uploads**: Standard HTTP, ideal for regular files
- **Transloadit uploads**: With powerful file processing capabilities

## What You'll Learn

This example demonstrates **three upload approaches** with Uppy in React Router v7:

1. **TUS server setup** with Express middleware for resumable uploads
2. **XHR uploads** using React Router's native resource routes
3. **Transloadit uploads** with signature generation and file processing
4. **File storage** with proper error handling
5. **Uppy Dashboard components** for all upload types

## Key Files

### `server.ts` - Express + TUS + React Router
```typescript
// Handle TUS uploads before React Router
app.all("/api/upload", (req, res) => tusServer.handle(req, res));
app.all("/api/upload/*", (req, res) => tusServer.handle(req, res));

// React Router handles everything else (including XHR uploads)
app.all("*", reactRouterHandler);
```

### `app/routes/_index.tsx` - Triple Upload Dashboard
```tsx
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import Xhr from "@uppy/xhr-upload";
import Transloadit from "@uppy/transloadit";

function createTusUppy() {
  return new Uppy().use(Tus, { endpoint: "/api/upload" });
}

function createXhrUppy() {
  return new Uppy().use(Xhr, { endpoint: "/upload" });
}

function createTransloaditUppy() {
  return new Uppy().use(Transloadit, {
    async assemblyOptions() {
      const res = await fetch('/transloadit-params', { method: 'POST' });
      return res.json();
    },
  });
}

export default function Index() {
  const [tusUppy] = useState(createTusUppy);
  const [xhrUppy] = useState(createXhrUppy);
  const [transloaditUppy] = useState(createTransloaditUppy);

  return (
    <>
      <Dashboard uppy={tusUppy} note="TUS: Resumable uploads" />
      <Dashboard uppy={xhrUppy} note="XHR: Standard uploads" />
      <Dashboard uppy={transloaditUppy} note="Transloadit: Processing uploads" />
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

### `app/routes/transloadit-params/route.ts` - Transloadit Signature Generation
```tsx
import { data } from 'react-router';
import crypto from 'crypto';

export async function action({ request }: ActionFunctionArgs) {
  const authKey = process.env.TRANSLOADIT_KEY;
  const authSecret = process.env.TRANSLOADIT_SECRET;
  const templateId = process.env.TRANSLOADIT_TEMPLATE_ID;

  const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000);
  const body = await request.json();

  const params = JSON.stringify({
    auth: { key: authKey, expires },
    template_id: templateId,
    fields: { customValue: body.customValue },
  });

  const signature = `sha384:${crypto
    .createHmac('sha384', authSecret)
    .update(Buffer.from(params, 'utf-8'))
    .digest('hex')}`;

  return data({ expires, signature, params });
}
```

### `app/routes.ts` - Route Configuration
```tsx
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("upload", "routes/upload/route.ts"), // XHR upload endpoint
  route("transloadit-params", "routes/transloadit-params/route.ts"), // Transloadit signature
] satisfies RouteConfig;
```

## Upload Methods

### 🔄 TUS Resumable Uploads
- **Best for**: Large files, unreliable connections
- **Endpoint**: `/api/upload` (Express middleware)
- **Features**: Resume interrupted uploads, chunked transfer
- **Storage**: Direct file system via `@tus/file-store`
- **Max size**: 50MB per file, 5 files max

### ⚡ XHR Standard Uploads
- **Best for**: Regular files, standard web uploads
- **Endpoint**: `/upload` (React Router resource route)
- **Features**: Simple HTTP POST, immediate response
- **Storage**: `@mjackson/file-storage` with form parsing
- **Max size**: 10MB per file, 3 files max

### ⚙️ Transloadit Processing Uploads
- **Best for**: Files requiring processing (resize, convert, etc.)
- **Endpoint**: `/transloadit-params` (signature generation)
- **Features**: Secure uploads with powerful processing pipeline
- **Storage**: Transloadit's global CDN with processing
- **Max size**: 100MB per file, 10 files max

## Transloadit Setup

To use Transloadit uploads, you need to:

1. **Sign up** at [transloadit.com](https://transloadit.com)
2. **Get your credentials** from your account dashboard
3. **Create a template** for your processing needs
4. **Set environment variables**:

```bash
export TRANSLOADIT_KEY="your_key_here"
export TRANSLOADIT_SECRET="your_secret_here"
export TRANSLOADIT_TEMPLATE_ID="your_template_id_here"
```

Or create a `.env` file:
```env
TRANSLOADIT_KEY=your_key_here
TRANSLOADIT_SECRET=your_secret_here
TRANSLOADIT_TEMPLATE_ID=your_template_id_here
```

**Security Note**: Always use signature authentication in production. This example generates secure signatures on the server to prevent tampering.

Perfect foundation for any file upload needs in React Router v7! 🚀
