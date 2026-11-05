import { createServer } from "node:http"
import { readFile } from "node:fs/promises"

const files = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
  "/app.js": "app.js",
  "/schedule.js": "schedule.js",
}

const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname
  const file = files[path]

  if (!file) {
    response.writeHead(404)
    response.end("Not found")
    return
  }

  try {
    const content = await readFile(new URL(`./${file}`, import.meta.url))
    let contentType = "text/html; charset=utf-8"
    if (file.endsWith(".js")) contentType = "text/javascript; charset=utf-8"
    if (file.endsWith(".css")) contentType = "text/css"

    response.setHeader("Content-Type", contentType)
    response.end(content)
  } catch {
    response.writeHead(404)
    response.end("Not found")
  }
})

server.listen(3000, "127.0.0.1", () => {
  console.log("Fight Terminal: http://localhost:3000")
})
