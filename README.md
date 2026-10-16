# Pathan Shakeel Khan — Personal Portfolio

Static, recruiter-ready portfolio for Cyber Security and Full-Stack development. Plain **HTML, CSS, and JavaScript** — no build step, optimized for **GitHub Pages** and **offline mobile viewing**.

## Live demo

[https://shakeelp07.github.io/portfolio/](https://shakeelp07.github.io/portfolio/)

## Features

- **Self-contained UI** — no CDN fonts or icon libraries; inline SVG sprite only
- **Times New Roman** editorial dark theme with cyan accent
- Circular **photo avatar** in navbar (no initials logo) + hero profile with WebP/JPG `<picture>`
- Photo-based **favicon** and PWA icons (`images/favicon-32.png`, `icon-192.png`, `icon-512.png`)
- Hero typing animation, animated grid background, scroll progress, sticky glass navbar
- Experience timeline, project cards, skill chips, certifications, education with marks badges
- **Web3Forms** contact form (online only) with loading/success/error states via `XMLHttpRequest`
- **Offline support**: `manifest.webmanifest` + `sw.js` (cache-first, background updates)
- **Offline badge** and disabled contact submit when `navigator.onLine` is false
- Service worker registers safely with error handling (safe for `file://` and LAN preview)
- Responsive hamburger menu, `prefers-reduced-motion`, semantic HTML & ARIA

## Project structure

```
index.html
404.html
style.css
script.js
sw.js
manifest.webmanifest
server.js
package.json
start.bat
start.sh
resume.pdf
images/
  profile.jpg
  profile.webp
  favicon-32.png
  icon-192.png
  icon-512.png
certificates/
  ransomware-techniques.pdf
```

## Run offline on my phone

You can run this portfolio on your laptop and browse it on your smartphone over local Wi-Fi or mobile hotspot with **zero internet connection required**.

### Quick steps:

1. **Install Node.js 18+ once** (from [nodejs.org](https://nodejs.org), if not already installed).
2. **Run `npm start`** (or double-click `start.bat` on Windows / `./start.sh` on macOS/Linux).
3. **Connect your phone to the same Wi-Fi network**, or turn on your phone's personal hotspot and connect your laptop to it. Internet access is not required.
4. **Open the Network URL** shown in the terminal on your phone browser (e.g. `http://192.168.1.5:3000`).

### Troubleshooting:

- **Windows Firewall**: If the page doesn't load on your phone, ensure Node.js is allowed through Windows Firewall on Private networks (Windows Defender Firewall → Allow an app through firewall).
- **Same Network**: Verify both your laptop and phone are connected to the exact same Wi-Fi router or phone hotspot.
- **Client Isolation**: Some public/guest Wi-Fi networks (hotels, cafes) enable "AP Client Isolation" which blocks devices from seeing each other. Use a phone mobile hotspot if this occurs.
- **VPN**: Disable any active VPN on your laptop or phone, as VPN tunnels can prevent local LAN routing.
- **Port Conflicts**: The server automatically tries the next port (3001, 3002...) if 3000 is occupied. You can also specify a custom port:
  ```bash
  PORT=8080 npm start
  ```

## Local preview options

- **Option A — Offline Node server (Recommended):**
  ```bash
  npm start
  ```
  Provides full LAN access for mobile, Gzip compression, Range requests (for PDFs/media), ETag caching, and styled 404 handling.

- **Option B — Direct file preview:**
  Open `index.html` directly in any web browser.

## Technologies

- HTML5, CSS3, vanilla JavaScript
- Node.js (built-in standard library HTTP server)
- Web3Forms API (contact, online only)
- GitHub Pages hosting

## License

Personal portfolio — © Pathan Shakeel Khan.
