#!/bin/bash

# Build script for Text-to-Image Extension

echo "Building Text-to-Image Extension..."

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Copy manifest and HTML/CSS files to dist
echo "Copying static files..."
cp manifest.json dist/
cp sidepanel.html dist/
cp sidepanel.css dist/

# Keep the directory structure for modules
echo "Organizing output files..."
# Content script doesn't use imports, so we can copy it to root
cp dist/content/content.js dist/content.js

# Background uses the bundled version (already in dist/background.js)
# Sidepanel uses imports, so keep it in its directory

# Copy icons if they exist
if [ -d "public/icons" ]; then
  mkdir -p dist/icons
  cp -r public/icons/* dist/icons/ 2>/dev/null || true
fi

echo "Build complete! Extension is ready in the 'dist' directory."
echo "Load the 'dist' directory in Chrome to test the extension."
