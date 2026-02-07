# Installation Guide

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Chrome browser (version 88+)
- FAL API key (get one at https://fal.ai/)

## Setup Steps

### 1. Install Dependencies

```bash
cd text-to-image-extension
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This will:
- Compile TypeScript files to JavaScript
- Copy all necessary files to the `dist/` directory
- Prepare the extension for loading in Chrome

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `text-to-image-extension/dist` directory
5. The extension should now appear in your extensions list

### 4. Configure API Key

1. Click the extension icon in Chrome's toolbar (or open any webpage)
2. The sidepanel will open automatically
3. Click the settings icon (⚙️) in the top-right
4. Enter your FAL API key
5. Click **Save**

## Verifying Installation

1. Navigate to any webpage
2. Highlight some text
3. Right-click and select **Generate Image**
4. The sidepanel should open (image generation will be implemented in later tasks)

## Troubleshooting

### Extension doesn't load
- Make sure you selected the `dist` directory, not the root project directory
- Check the Chrome extensions page for any error messages
- Verify all files were built correctly by checking the `dist/` directory

### TypeScript compilation errors
- Ensure you have the correct Node.js version installed
- Try deleting `node_modules` and running `npm install` again
- Check that all TypeScript files are valid

### Build script fails
- On Windows, you may need to use Git Bash or WSL to run the build script
- Alternatively, run `npm run build:ts` and manually copy files to `dist/`

## Development Workflow

### Making Changes

1. Edit TypeScript files in the `src/` directory
2. Run `npm run build` to recompile
3. Go to `chrome://extensions/` and click the refresh icon on your extension
4. Test your changes

### Watch Mode

For continuous development, use watch mode:

```bash
npm run watch
```

This will automatically recompile TypeScript files when you save changes. You'll still need to manually refresh the extension in Chrome.

## Next Steps

After installation, the extension structure is ready for implementing:
- Text selection capture
- FAL API integration
- Image generation and display
- History management

Refer to the main README.md for the full feature list and development roadmap.
