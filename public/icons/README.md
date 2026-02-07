# Extension Icons

This directory should contain the extension icons in the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Quick Icon Creation

An SVG template (icon.svg) has been provided. To convert it to PNG:

### Using Online Tools
1. Go to https://cloudconvert.com/svg-to-png
2. Upload icon.svg
3. Convert to PNG at sizes: 16x16, 48x48, 128x128
4. Save as icon16.png, icon48.png, icon128.png

### Using ImageMagick (if installed)
```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Using Inkscape (if installed)
```bash
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

## Note

The extension will work without icons, but Chrome will show a default placeholder icon. For a professional appearance, create proper PNG icons before publishing.
