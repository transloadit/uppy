# React Router v7 + Uppy TUS Example

**Minimal showcase** of Uppy Dashboard with TUS resumable uploads in React Router v7 framework mode.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to upload files with resumable TUS protocol.

## What You'll Learn

This example shows the **bare minimum** to integrate Uppy with React Router v7:

1. **TUS server setup** alongside React Router
2. **Uppy Dashboard component** in a React Router route
3. **File upload with resume capability**

## Key Files

### `server.js` - Express + TUS + React Router
```javascript
// Handle TUS uploads before React Router
app.all("/api/upload", (req, res) => tusServer.handle(req, res));
app.all("/api/upload/*", (req, res) => tusServer.handle(req, res));

// React Router handles everything else
app.all("*", reactRouterHandler);
```

### `app/routes/_index.tsx` - Uppy Dashboard
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

### `app/entry.server.tsx` - Simple SSR
```tsx
export default function handleRequest(request, status, headers, context) {
  const html = renderToString(<ServerRouter context={context} url={request.url} />);
  return new Response(`<!DOCTYPE html>${html}`, { headers, status });
}
```

### `app/entry.client.tsx` - Simple Hydration
```tsx
import { HydratedRouter } from "react-router/dom";
import { hydrateRoot } from "react-dom/client";

hydrateRoot(document, <HydratedRouter />);
```

## That's It!

Just **4 files** to get Uppy working with React Router v7:
- Express server with TUS
- Upload route with Dashboard
- Basic SSR
- Basic hydration

Perfect starting point for adding file uploads to your React Router v7 app! 🚀
