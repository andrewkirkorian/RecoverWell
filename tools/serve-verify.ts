// Throwaway second instance of the built RecoverWell site, for verification only.
// Same shape as the team's serve.ts, but pinned to port 3100 and reading
// MONGODB_URI from the environment so it talks to a local throwaway mongod.
// Port 3000 / the published site is untouched by anything in tools/.
//
// Run `bun run build` first: this serves whatever is in dist/ right now.
const ROOT = new URL("..", import.meta.url).pathname;
const PORT = 3100;
const HOST = "127.0.0.1";

const { default: handler } = (await import(`${ROOT}dist/server/server.js`)) as {
  default: { fetch: (r: Request) => Response | Promise<Response> };
};

Bun.serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: 255,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname !== "/") {
      const file = Bun.file(`${ROOT}dist/client${pathname}`);
      if (await file.exists()) return new Response(file);
    }
    return handler.fetch(req);
  },
});

console.log(`verify instance serving on http://${HOST}:${String(PORT)}`);
