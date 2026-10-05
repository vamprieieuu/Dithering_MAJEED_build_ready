#!/bin/bash
# Copies the patched plugin into common Photoshop UXP developer plugin folders.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_NAME="DitherTone"

TARGETS=(
  "$HOME/Library/Application Support/Adobe/UXP/Developer/Plugins/$PLUGIN_NAME"
  "$HOME/Library/Application Support/Adobe/UXP/Developer/plugins/$PLUGIN_NAME"
  "$HOME/Library/Application Support/Adobe/UXP/Developer/Plugins/com.doronsupply.dithertone"
)

echo "Source: $SRC"
for TARGET in "${TARGETS[@]}"; do
  mkdir -p "$(dirname "$TARGET")"
  rm -rf "$TARGET"
  cp -R "$SRC" "$TARGET"
  echo "Installed to: $TARGET"
done

echo ""
echo "Reload in Photoshop:"
echo "  Plugins > DitherTone Pro Plugin (or restart Photoshop)"
echo "If you use UXP Developer Tools, point the plugin folder to:"
echo "  $SRC"
