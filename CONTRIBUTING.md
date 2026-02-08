# Contributing to Vizify

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork and clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/vizify.git
   cd vizify
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the extension
   ```bash
   npm run build
   ```

4. Load in Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Making Changes

1. Create a new branch
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes in the `src/` directory

3. Build and test
   ```bash
   npm run build
   npm test
   ```

4. Reload the extension in Chrome to test

## Code Guidelines

- Use TypeScript for type safety
- Follow existing code style
- Add tests for new features
- Keep functions small and focused
- Add comments for complex logic

## Commit Messages

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `style: Format code`
- `test: Add tests`

## Submitting a Pull Request

1. Push your branch
   ```bash
   git push origin feature/your-feature
   ```

2. Open a Pull Request on GitHub
3. Describe your changes clearly
4. Wait for review

## Reporting Issues

When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Chrome version
- Console errors (if any)

## Questions?

Open an issue for questions or discussions!

## License

By contributing, you agree your contributions will be licensed under MIT.
