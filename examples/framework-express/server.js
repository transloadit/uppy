import { createRequestHandler } from "@react-router/express";
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";
import compression from "compression";
import express from "express";
import { mkdir } from "fs/promises";
import morgan from "morgan";
import path from "path";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
await mkdir(uploadDir, { recursive: true }).catch(() => {
  // Directory might already exist, ignore the error
});

// Create TUS server
const tusServer = new TusServer({
  path: "/api/upload",
  datastore: new FileStore({ directory: uploadDir }),
  respectForwardedHeaders: true,
});

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const reactRouterHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

app.use(compression());
app.disable("x-powered-by");

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));

// Handle TUS uploads before React Router
app.all("/api/upload/*", (req, res) => {
  return tusServer.handle(req, res);
});

app.all("*", reactRouterHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
