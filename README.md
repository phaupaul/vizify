# Vizify

> Transform any text on the web into stunning AI-generated images instantly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://www.google.com/chrome/)

A sleek Chrome extension that generates AI images from text using FAL's Flux Schnell model. Select any text on the web, right-click, and watch it transform into stunning images.

## 🎬 Demo

<div align="center">
  <video src="https://github.com/YOUR_USERNAME/vizify/raw/main/vizify-demo-20260207.mov" width="800" controls>
    Your browser does not support the video tag.
  </video>
</div>

## ✨ Features

- 🎨 **AI Image Generation** - Powered by FAL's Flux Schnell model
- 🖱️ **Right-Click to Generate** - Select text anywhere and generate images
- ⌨️ **Direct Input** - Type or paste prompts directly
- 📚 **History** - Automatically saves your last 50 images
- 💾 **Download & Share** - Download images or copy URLs
- 🎯 **Modern UI** - Beautiful, minimalist design with smooth animations

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vizify.git
   cd vizify
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
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

5. **Add your FAL API key**
   - Click the extension icon
   - Click "Settings" at the bottom
   - Enter your [FAL API key](https://fal.ai)
   - Click "Save"

### Usage

**Method 1: Right-Click (Recommended)**
1. Select text on any webpage
2. Right-click and choose "Generate Image"
3. Watch your image appear in the sidepanel

**Method 2: Direct Input**
1. Click the extension icon
2. Type or paste your prompt
3. Click "✨ Generate Image"

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test

# Watch mode for development
npm run watch
```

## 📝 Tech Stack

- TypeScript
- Chrome Extension Manifest V3
- FAL AI (Flux Schnell)
- Jest for testing

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Powered by [FAL AI](https://fal.ai)
- Inspired by modern web design principles

---

**Made with ❤️ by [Your Name]**
