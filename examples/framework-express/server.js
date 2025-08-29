import { createRequestHandler } from "@react-router/express";
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";
import express from "express";
import { mkdir } from "fs/promises";
import path from "path";

// Setup upload directory
const uploadDir = path.join(process.cwd(), "uploads");
await mkdir(uploadDir, { recursive: true }).catch(() => {});

// Create TUS server for resumable uploads
const tusServer = new TusServer({
  path: "/api/upload",
  datastore: new FileStore({ directory: uploadDir }),
});

// Setup Vite dev server or production build
const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({ server: { middlewareMode: true } })
      );

// React Router request handler
const reactRouterHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

// Vite dev middleware or static assets
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use("/assets", express.static("build/client/assets"));
  app.use(express.static("build/client"));
}

// TUS upload endpoints (before React Router)
app.all("/api/upload", (req, res) => tusServer.handle(req, res));
app.all("/api/upload/*", (req, res) => tusServer.handle(req, res));

// React Router handles all other routes
app.all("*", reactRouterHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 TUS uploads: /api/upload`);
});
