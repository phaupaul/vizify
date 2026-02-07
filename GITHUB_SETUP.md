# GitHub Setup Guide

Follow these steps to push your extension to GitHub:

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `text-to-image-extension` (or your preferred name)
   - **Description**: "Chrome extension to generate AI images from text using FAL's Flux Schnell model"
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## 2. Connect Your Local Repository

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/text-to-image-extension.git

# Push your code
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## 3. Update README

After pushing, update the README.md file to replace placeholder URLs:
- Change `YOUR_USERNAME` to your actual GitHub username in the Support section
- Add screenshots if desired

## 4. Optional: Add Topics

On your GitHub repository page:
1. Click the gear icon next to "About"
2. Add topics: `chrome-extension`, `ai`, `image-generation`, `typescript`, `fal-ai`, `flux`
3. Save changes

## 5. Optional: Create a Release

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `v1.0.0 - Initial Release`
5. Description: Copy from README features section
6. Attach the `dist` folder as a zip file (optional)
7. Publish release

## 6. Share Your Extension!

Your extension is now on GitHub! Share the link:
```
https://github.com/YOUR_USERNAME/text-to-image-extension
```

## Keeping It Updated

When you make changes:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: Add new feature"

# Push to GitHub
git push
```

## Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
