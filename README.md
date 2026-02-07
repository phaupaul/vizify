# Text to Image Generator - Chrome Extension

> Transform any text on the web into stunning AI-generated images with a single click.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://www.google.com/chrome/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

A sleek, modern Chrome extension that generates AI images from text using FAL's Flux Schnell model. Select any text on the web, right-click, and watch it transform into stunning images.

## ✨ Features

- **🎨 AI Image Generation**: Powered by FAL's Flux Schnell model for fast, high-quality results
- **🖱️ Context Menu Integration**: Right-click any selected text to generate images
- **⌨️ Direct Input**: Type or paste prompts directly in the sidepanel
- **📚 History Management**: Automatically saves your last 50 generated images
- **💾 Download & Share**: Download images, copy URLs, or open in new tabs
- **🔒 Secure API Key Storage**: Your FAL API key is stored locally and never shared
- **🎯 Modern UI**: Clean, minimalist design with smooth animations

## 🚀 Installation

### Prerequisites
- Google Chrome browser
- FAL API key ([Get one here](https://fal.ai))

### Steps

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd text-to-image-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

5. **Configure your API key**
   - Click the extension icon to open the sidepanel
   - Click the settings icon (⚙️)
   - Enter your FAL API key
   - Click "Save"

## 📖 Usage

### Method 1: Context Menu (Recommended)
1. Navigate to any webpage
2. Select some text
3. Right-click and choose "Generate Image"
4. The sidepanel opens and generates your image automatically

### Method 2: Direct Input
1. Click the extension icon to open the sidepanel
2. Type or paste your prompt in the text area
3. Click "✨ Generate Image"
4. Watch your image appear!

## 🎯 Features in Detail

### Image Actions
- **🔍 Open**: View the full-size image in a new tab
- **📋 Copy**: Copy the image URL to your clipboard
- **⬇️ Save**: Download the image to your computer

### History
- Automatically saves your last 50 generated images
- Click any history item to open it in a new tab
- Clear all history with one click

### Error Handling
- User-friendly error messages
- Automatic retry functionality
- Network error detection
- API key validation

## 🛠️ Development

### Project Structure
```
text-to-image-extension/
├── src/
│   ├── background/     # Background service worker
│   ├── content/        # Content script for text selection
│   ├── sidepanel/      # Sidepanel UI and logic
│   └── types.ts        # TypeScript type definitions
├── dist/               # Built extension (load this in Chrome)
├── public/             # Static assets
└── tests/              # Test files
```

### Available Scripts

- `npm run build` - Build the extension
- `npm run watch` - Watch for changes and rebuild
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Tech Stack

- **TypeScript** - Type-safe development
- **Chrome Extension Manifest V3** - Latest extension platform
- **FAL API** - AI image generation
- **Jest** - Testing framework

## 🔒 Privacy & Security

- Your API key is stored locally using Chrome's storage API
- No data is sent to any servers except FAL's API for image generation
- All communication happens directly between your browser and FAL
- No tracking or analytics

## 🐛 Troubleshooting

### Extension won't load
- Make sure you're loading the `dist` folder, not the root folder
- Check that you've run `npm run build` first
- Look for errors in `chrome://extensions/`

### Images not generating
- Verify your FAL API key is correct in settings
- Check your internet connection
- Look for errors in the service worker console (click "service worker" link in `chrome://extensions/`)

### Context menu not appearing
- Make sure you've selected text on the page
- The extension doesn't work on Chrome system pages (chrome://, chrome-extension://)
- Try refreshing the page

## 📝 License

MIT License - feel free to use and modify as needed!

## 🙏 Acknowledgments

- Powered by [FAL AI](https://fal.ai)
- Uses the Flux Schnell model for fast, high-quality image generation
- Built with Chrome Extension Manifest V3

## 📧 Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/YOUR_USERNAME/text-to-image-extension/issues)
- Check the [troubleshooting section](#-troubleshooting)

---

**Enjoy creating amazing images from text! ✨**


## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up the development environment
- Code style guidelines
- Submitting pull requests
- Reporting bugs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
