import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const allowed = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/app.js": "app.js",
  "/schedule.js": "schedule.js",
};
createServer(async (req, res) => {
  const file = allowed[new URL(req.url, "http://localhost").pathname];
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  try {
    const data = await readFile(new URL(`./${file}`, import.meta.url));
    res.setHeader(
      "Content-Type",
      file.endsWith(".js")
        ? "text/javascript; charset=utf-8"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html; charset=utf-8",
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(3000, "127.0.0.1", () =>
  console.log("Fight Terminal: http://localhost:3000"),
);
