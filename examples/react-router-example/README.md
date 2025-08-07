# React Router Uppy Example

This example demonstrates how to use Uppy with React Router, featuring:

- **React Router 6** (with migration notes for React Router 7)
- **TUS resumable uploads** with a custom server implementation  
- **Uppy Dashboard** with dark theme
- **Vite** for fast development

## Features

- Resumable file uploads using the TUS protocol
- Client-side routing with React Router
- File drag and drop support
- Progress tracking and upload management
- Custom TUS server implementation

## How to run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start both the TUS server and development server:
   ```bash
   npm run dev:full
   ```

   Or run them separately:
   ```bash
   # Terminal 1 - TUS Server (runs on port 3001)
   npm run server
   
   # Terminal 2 - React App (runs on port 5173) 
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.

## Architecture

- `src/App.tsx` - Main app with routing and Uppy dashboard
- `server.js` - TUS server implementation
- `vite.config.ts` - Vite configuration with proxy for TUS server

## Upload Server

The example includes a custom TUS server implementation at `http://localhost:3001/api/upload` that:

- Handles TUS protocol (POST, PATCH, HEAD, OPTIONS)
- Saves files to the `uploads/` directory  
- Supports resumable uploads
- Provides proper CORS headers

The Vite dev server proxies `/api/*` requests to the TUS server.

## Migrating to React Router 7

To upgrade this example to React Router 7 with resource routes:

### 1. Update dependencies
```bash
npm install @react-router/dev @react-router/node @react-router/serve react-router@^7
npm uninstall react-router-dom
```

### 2. Create app structure
```
app/
├── root.tsx          # Root layout
├── routes.ts         # Route configuration
├── routes/
│   ├── home.tsx      # Dashboard page
│   └── upload.ts     # TUS upload resource route
└── entry.client.tsx  # Client entry
```

### 3. Resource route for uploads
Instead of a separate server, implement uploads as a resource route:

```typescript
// app/routes/upload.ts
export async function action({ request }: { request: Request }) {
  // Handle TUS POST/PATCH requests
  // Return Response with appropriate headers
}

export async function loader({ request }: { request: Request }) {
  // Handle TUS HEAD requests for upload status
  // Return Response with upload offset
}
```

### 4. Update configuration
- Replace `vite.config.ts` with React Router 7 config
- Add `react-router.config.ts`
- Update `package.json` scripts

See the [React Router 7 documentation](https://reactrouter.com/how-to/resource-routes) for complete migration details.

## Learn More

- [React Router 6 Documentation](https://reactrouter.com/en/6.23.1)
- [React Router 7 Documentation](https://reactrouter.com/)
- [Uppy Documentation](https://uppy.io/docs/)
- [TUS Protocol](https://tus.io/)
- [Resource Routes Guide](https://reactrouter.com/how-to/resource-routes)