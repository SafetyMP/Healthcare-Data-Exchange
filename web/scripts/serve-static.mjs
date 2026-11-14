// Preview the exact Pages export under its repository subpath, without API fallback.
import { createServer } from "node:http";
import { open } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/Healthcare-Data-Exchange";
const port = Number(process.env.PORT ?? 3100);
const mimeTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let file;
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404).end("Not found");
      return;
    }
    let path = resolve(root, `.${pathname.slice(basePath.length) || "/"}`);
    if (path !== root && !path.startsWith(`${root}${sep}`)) {
      response.writeHead(404).end("Not found");
      return;
    }
    file = await open(path, "r");
    if ((await file.stat()).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        response.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      await file.close();
      file = undefined;
      path = resolve(path, "index.html");
      file = await open(path, "r");
    }
    // Read the already-opened descriptor, so path replacement cannot change
    // the file between inspecting it and reading its contents.
    const content = await file.readFile();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(path)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404).end("Not found");
  } finally {
    await file?.close();
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static demo: http://127.0.0.1:${port}${basePath}/`);
});
