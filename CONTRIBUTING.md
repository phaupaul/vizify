# Contributing to Text-to-Image Extension

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/text-to-image-extension.git
   cd text-to-image-extension
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Build the extension**
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit source files in `src/`
   - Update tests if needed
   - Update documentation if needed

3. **Build and test**
   ```bash
   npm run build
   npm test
   ```

4. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder
   - Test your changes

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use meaningful variable names

### Testing

- Write unit tests for new functionality
- Ensure all existing tests pass
- Test manually in Chrome before submitting

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add new feature`
- `fix: Fix bug in image generation`
- `docs: Update README`
- `style: Format code`
- `refactor: Refactor storage module`
- `test: Add tests for API client`

## Submitting Changes

1. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes
   - Submit the PR

### Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused on a single feature/fix

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Chrome version
- Extension version
- Console errors (if any)

### Feature Requests

Include:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (optional)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Questions?

Feel free to open an issue for questions or discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
