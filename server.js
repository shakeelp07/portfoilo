/**
 * Local offline static web server for portfolio
 * Zero external npm dependencies — Node.js standard library only
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const { performance } = require("perf_hooks");

// Determine project root directory (current directory or inner portfolio directory)
const ROOT_DIR = fs.existsSync(path.join(__dirname, "index.html"))
  ? __dirname
  : (fs.existsSync(path.join(__dirname, "portfoilo-main", "index.html"))
    ? path.join(__dirname, "portfoilo-main")
    : __dirname);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

// MIME types dictionary with UTF-8 charset on text types
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// Files compressible with gzip
const COMPRESSIBLE_EXTS = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".webmanifest",
  ".svg",
  ".txt",
]);

// Blocked files that should never be served
const BLOCKED_NAMES = new Set([
  "server.js",
  "package.json",
  "package-lock.json",
  "readme.md",
  "start.bat",
  "start.sh",
  "process-profile.py",
]);

// Standard security headers
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "no-referrer",
};

/**
 * Log request completion in one line
 */
function logRequest(req, status, startTime) {
  const duration = Math.max(1, Math.round(performance.now() - startTime));
  const timeStr = new Date().toTimeString().split(" ")[0];
  console.log(`[${timeStr}] ${req.method} ${req.url} ${status} ${duration}ms`);
}

/**
 * Serve styled 404 page
 */
function send404(req, res, startTime) {
  const notFoundFile = path.join(ROOT_DIR, "404.html");
  fs.readFile(notFoundFile, (err, content) => {
    if (err) {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        ...SECURITY_HEADERS,
      });
      res.end("404 Not Found");
    } else {
      res.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        ...SECURITY_HEADERS,
      });
      res.end(content);
    }
    logRequest(req, 404, startTime);
  });
}

/**
 * Request handler
 */
function handleRequest(req, res) {
  const startTime = performance.now();

  // Only allow GET and HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS });
    res.end("Method Not Allowed");
    logRequest(req, 405, startTime);
    return;
  }

  const isHead = req.method === "HEAD";

  // Parse and decode requested pathname
  let reqPath;
  try {
    reqPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (err) {
    send404(req, res, startTime);
    return;
  }

  // "/" maps to "index.html"
  if (reqPath === "/" || reqPath === "") {
    reqPath = "/index.html";
  } else if (reqPath.endsWith("/")) {
    reqPath += "index.html";
  }

  // Normalize path and prevent path traversal
  const normalizedRel = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
  const safePath = path.resolve(ROOT_DIR, "." + path.sep + normalizedRel);

  // Verify the resolved path is strictly inside ROOT_DIR
  if (!safePath.startsWith(ROOT_DIR + path.sep) && safePath !== ROOT_DIR) {
    send404(req, res, startTime);
    return;
  }

  // Block sensitive files, dotfiles, and source files
  const relToRoot = path.relative(ROOT_DIR, safePath);
  const segments = relToRoot.split(path.sep);
  const isDotFile = segments.some((part) => part.startsWith("."));
  const baseName = path.basename(safePath).toLowerCase();

  if (isDotFile || BLOCKED_NAMES.has(baseName)) {
    send404(req, res, startTime);
    return;
  }

  // Stat the file
  fs.stat(safePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      send404(req, res, startTime);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Cache-Control policy: no-cache for HTML and sw.js, max-age=86400 for media/fonts
    let cacheControl = "public, max-age=3600";
    if (ext === ".html" || baseName === "sw.js" || ext === ".webmanifest") {
      cacheControl = "no-cache";
    } else if (
      ext === ".png" ||
      ext === ".jpg" ||
      ext === ".jpeg" ||
      ext === ".webp" ||
      ext === ".ico" ||
      ext === ".svg" ||
      ext === ".woff2"
    ) {
      cacheControl = "public, max-age=86400";
    }

    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const lastModified = stat.mtime.toUTCString();

    // Check Conditional GET (If-None-Match / If-Modified-Since)
    const ifNoneMatch = req.headers["if-none-match"];
    const ifModifiedSince = req.headers["if-modified-since"];

    if (
      (ifNoneMatch && ifNoneMatch === etag) ||
      (!ifNoneMatch && ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime)
    ) {
      res.writeHead(304, {
        "ETag": etag,
        "Last-Modified": lastModified,
        "Cache-Control": cacheControl,
        ...SECURITY_HEADERS,
      });
      res.end();
      logRequest(req, 304, startTime);
      return;
    }

    // Handle Range requests (supports streaming PDFs & videos smoothly on mobile)
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        res.writeHead(416, {
          "Content-Range": `bytes */${stat.size}`,
          "Content-Type": "text/plain; charset=utf-8",
          ...SECURITY_HEADERS,
        });
        res.end("Requested Range Not Satisfiable");
        logRequest(req, 416, startTime);
        return;
      }

      let start = match[1] ? parseInt(match[1], 10) : undefined;
      let end = match[2] ? parseInt(match[2], 10) : undefined;

      if (start === undefined && end !== undefined) {
        start = Math.max(0, stat.size - end);
        end = stat.size - 1;
      } else if (start !== undefined && end === undefined) {
        end = stat.size - 1;
      }

      if (
        start === undefined ||
        end === undefined ||
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        start > end ||
        end >= stat.size
      ) {
        res.writeHead(416, {
          "Content-Range": `bytes */${stat.size}`,
          "Content-Type": "text/plain; charset=utf-8",
          ...SECURITY_HEADERS,
        });
        res.end("Requested Range Not Satisfiable");
        logRequest(req, 416, startTime);
        return;
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "ETag": etag,
        "Last-Modified": lastModified,
        ...SECURITY_HEADERS,
      });

      if (isHead) {
        res.end();
        logRequest(req, 206, startTime);
        return;
      }

      const fileStream = fs.createReadStream(safePath, { start, end });
      fileStream.on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
      fileStream.pipe(res);
      res.on("finish", () => logRequest(req, 206, startTime));
      return;
    }

    // Determine gzip compression eligibility
    const acceptEncoding = req.headers["accept-encoding"] || "";
    const canGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes("gzip");

    if (canGzip) {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Encoding": "gzip",
        "Vary": "Accept-Encoding",
        "Cache-Control": cacheControl,
        "ETag": etag,
        "Last-Modified": lastModified,
        "Accept-Ranges": "bytes",
        ...SECURITY_HEADERS,
      });

      if (isHead) {
        res.end();
        logRequest(req, 200, startTime);
        return;
      }

      const rawStream = fs.createReadStream(safePath);
      const gzipStream = zlib.createGzip();
      rawStream.on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
      rawStream.pipe(gzipStream).pipe(res);
      res.on("finish", () => logRequest(req, 200, startTime));
      return;
    }

    // Standard uncompressed response
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Cache-Control": cacheControl,
      "ETag": etag,
      "Last-Modified": lastModified,
      "Accept-Ranges": "bytes",
      ...SECURITY_HEADERS,
    });

    if (isHead) {
      res.end();
      logRequest(req, 200, startTime);
      return;
    }

    const fileStream = fs.createReadStream(safePath);
    fileStream.on("error", () => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
    fileStream.pipe(res);
    res.on("finish", () => logRequest(req, 200, startTime));
  });
}

/**
 * Retrieve all non-internal IPv4 LAN addresses
 */
function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      const isIpv4 = net.family === "IPv4" || net.family === 4;
      if (isIpv4 && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

/**
 * Print server startup banner
 */
function printBanner(port) {
  const lanAddresses = getLanAddresses();
  console.log("");
  console.log("====================================================");
  console.log("  Portfolio Local & Offline Server");
  console.log("====================================================");
  console.log(`  Local:    http://localhost:${port}`);
  console.log(`  Hostname: http://${os.hostname().toLowerCase()}.local:${port}`);
  if (lanAddresses.length > 0) {
    for (const ip of lanAddresses) {
      console.log(`  Network:  http://${ip}:${port}`);
    }
  } else {
    console.log("  Network:  (No active Wi-Fi or LAN connection found)");
  }
  console.log("----------------------------------------------------");
  console.log("  Open the Network URL on your phone over Wi-Fi or hotspot.");
  console.log("  Press Ctrl+C to stop the server.");
  console.log("====================================================");
  console.log("");
}

/**
 * Start HTTP server with automatic port retry on conflict
 */
let activeServer = null;

function startServer(port) {
  const server = http.createServer(handleRequest);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Port ${port} is busy, trying port ${port + 1}...]`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
    }
  });

  server.listen(port, "0.0.0.0", () => {
    activeServer = server;
    printBanner(port);
  });
}

// Clean shutdown on SIGINT and SIGTERM
function cleanShutdown() {
  console.log("\nShutting down server cleanly...");
  if (activeServer) {
    activeServer.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", cleanShutdown);
process.on("SIGTERM", cleanShutdown);

// Start server
startServer(DEFAULT_PORT);
