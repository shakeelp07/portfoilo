#!/usr/bin/env bash
# One-click launcher for macOS and Linux
# If permission is denied, make this file executable first by running:
#   chmod +x start.sh

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR" || exit 1

echo "Starting Portfolio Local Offline Server..."
node server.js
