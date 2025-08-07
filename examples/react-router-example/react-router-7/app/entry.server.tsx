import { createRequestHandler } from "@react-router/node";
import { type ServerBuild } from "react-router";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
  : await import("../build/server/index.js");

const requestHandler = createRequestHandler(build as ServerBuild);

export default requestHandler;
