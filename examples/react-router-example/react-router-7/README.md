# React Router 7 Migration Example

This folder contains the React Router 7 version of the Uppy example using resource routes.

## Key Differences from React Router 6

1. **Resource Routes**: Upload handling moved from separate server to resource routes
2. **File-based Routing**: Routes defined in `app/routes.ts` 
3. **Server-Side Rendering**: Built-in SSR support
4. **Type Safety**: Enhanced TypeScript integration

## Files

- `root.tsx` - Root layout with error boundaries
- `routes.ts` - Route configuration
- `routes/home.tsx` - Dashboard component
- `routes/upload.ts` - TUS upload resource route
- `entry.client.tsx` - Client hydration
- `entry.server.tsx` - Server entry point

## Usage

```bash
npm install @react-router/dev @react-router/node @react-router/serve react-router@^7
npm run dev  # React Router dev server
```

The resource route handles TUS uploads directly without needing a separate server.
