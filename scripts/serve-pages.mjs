import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docs = resolve(root, "docs");
const base = "/film-color-script-generator/";
const portArgIndex = process.argv.indexOf("--port");
const port = Number(portArgIndex >= 0 ? process.argv[portArgIndex + 1] : process.env.PORT) || 4173;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"]
]);

function sendFile(res, path) {
  const type = mimeTypes.get(extname(path)) ?? "application/octet-stream";
  res.writeHead(200, {
    "content-type": type,
    "cache-control": "no-store",
    "cross-origin-resource-policy": "same-origin"
  });
  createReadStream(path).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname === "/") {
    res.writeHead(302, { location: base });
    res.end();
    return;
  }

  if (!url.pathname.startsWith(base)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const relative = decodeURIComponent(url.pathname.slice(base.length)) || "index.html";
  const safePath = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(docs, safePath);
  const path =
    existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(docs, "index.html");

  sendFile(res, path);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${docs} at http://127.0.0.1:${port}${base}`);
});
