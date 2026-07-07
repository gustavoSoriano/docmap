#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="DocMap"
APP_DIR="/Applications/${APP_NAME}.app"
BINARY_DEST="${APP_DIR}/Contents/MacOS/docmap"

echo "⬡  docmap — instalação"
echo ""

# verifica Deno
if ! command -v deno &>/dev/null; then
  echo "Instalando Deno..."
  curl -fsSL https://deno.land/install.sh | sh
  export PATH="$HOME/.deno/bin:$PATH"
fi

cd "$SCRIPT_DIR"

echo "1/4  Gerando bundle da UI..."
deno run --allow-read --allow-write scripts/bundle-ui.ts

echo "2/4  Compilando binário..."
deno compile \
  --allow-read --allow-write --allow-net \
  --allow-env --allow-run --allow-ffi \
  --unstable-kv \
  --include src/worker.ts \
  --include src/server/handlers/ui-bundle.gen.ts \
  --output /tmp/docmap-build \
  src/main.ts

echo "3/4  Criando ${APP_NAME}.app..."
sudo mkdir -p "${APP_DIR}/Contents/MacOS"
sudo mkdir -p "${APP_DIR}/Contents/Resources"
sudo mv /tmp/docmap-build "$BINARY_DEST"
sudo chmod +x "$BINARY_DEST"
xattr -d com.apple.quarantine "$BINARY_DEST" 2>/dev/null || true

# Info.plist — registra o app no macOS
sudo tee "${APP_DIR}/Contents/Info.plist" > /dev/null << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>DocMap</string>
    <key>CFBundleDisplayName</key>
    <string>DocMap</string>
    <key>CFBundleIdentifier</key>
    <string>com.gustavosoriano.docmap</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleExecutable</key>
    <string>docmap</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
PLIST

echo "4/4  Instalando comando docmap no terminal..."
sudo ln -sf "$BINARY_DEST" /usr/local/bin/docmap

echo ""
echo "✓  Instalado em /Applications/DocMap.app"
echo "   • Abra pelo Finder, Spotlight ou Launchpad"
echo "   • Ou rode no terminal: docmap"
