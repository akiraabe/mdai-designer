# Contributing to mdai-designer 🤝

Thank you for your interest in contributing to mdai-designer! This document provides guidelines and information for contributors.

## 🎯 How to Contribute

### 1. Fork & Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/mdai-designer.git
cd mdai-designer
git remote add upstream https://github.com/akiraabe/mdai-designer.git
```

### 2. Setup Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Create Feature Branch
```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/amazing-feature
```

### 4. Make Changes
- Write clean, maintainable code
- Follow existing code style and patterns
- Add tests if applicable
- Update documentation if needed

### 5. Test Your Changes
```bash
# Run linting
npm run lint

# Build the project
npm run build

# Test locally
npm run dev
```

### 6. Commit & Push
```bash
# Commit your changes
git add .
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/amazing-feature
```

### 7. Create Pull Request
- Open a Pull Request from your feature branch to the main repository
- Provide a clear description of your changes
- Reference any related issues

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Provide proper type annotations
- Follow existing interface patterns

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Separate UI logic from business logic using custom hooks

### File Organization
```
src/
├── components/           # UI components
│   ├── Common/          # Shared components
│   ├── Document/        # Document-specific components
│   └── Project/         # Project-specific components
├── hooks/               # Custom hooks (business logic)
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── services/            # External services integration
```

### Code Style
- Use descriptive variable and function names
- Write self-documenting code
- Add comments for complex logic only
- Follow existing indentation and formatting

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable

### Bug Report Template
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Browser: [e.g. Chrome 100]
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.12.0]

## Screenshots
If applicable, add screenshots
```

## ✨ Feature Requests

For feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Provide clear use case** for the feature
3. **Describe the proposed solution** in detail
4. **Consider alternatives** you've evaluated

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why this feature would be useful

## Proposed Solution
Detailed description of how this could work

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other context or screenshots
```

## 🔧 Development Guidelines

### Custom Hooks Pattern
Follow the existing pattern for state management:

```typescript
// Business logic in custom hooks
export const useMyFeature = () => {
  const [state, setState] = useState(initialState);
  
  const handleAction = useCallback(() => {
    // Business logic here
  }, [dependencies]);
  
  return {
    state,
    handleAction
  };
};

// UI components use hooks
export const MyComponent: React.FC = () => {
  const { state, handleAction } = useMyFeature();
  
  return (
    // UI rendering only
  );
};
```

### Component Architecture
- **Presentation Components**: Focus on UI rendering
- **Container Components**: Handle data and state
- **Custom Hooks**: Encapsulate business logic
- **Services**: External integrations (AI, storage)

### Error Handling
- Use proper error boundaries
- Provide meaningful error messages
- Handle edge cases gracefully
- Log errors appropriately

## 🧪 Testing

### Manual Testing
Before submitting a PR, please test:

1. **Core Functionality**: All main features work
2. **UI Responsiveness**: Works on different screen sizes
3. **Browser Compatibility**: Test in major browsers
4. **Error Scenarios**: Handle invalid inputs gracefully

### Future Testing
We plan to add:
- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests with Playwright
- Visual regression tests

## 📚 Documentation

When contributing, please update:

- **README.md**: For user-facing changes
- **CLAUDE.md**: For technical architecture changes
- **Code Comments**: For complex business logic
- **Type Definitions**: For new interfaces

## 🏷️ Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(ai): add @mention functionality for cross-document references
fix(spreadsheet): resolve focus issue in edit mode
docs(readme): update installation instructions
refactor(hooks): separate document state management
```

## 🤔 Questions?

If you have questions about contributing:

1. **Check existing documentation** first
2. **Search existing issues** for similar questions
3. **Open a new discussion** in GitHub Discussions
4. **Reach out via issues** for specific problems

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project conventions
- [ ] No console.log statements in production code
- [ ] TypeScript compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] PR description explains the changes

## 🎉 Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Appreciated in the community

Thank you for contributing to mdai-designer! 🚀

---

## 📞 Contact

- **Issues**: https://github.com/akiraabe/mdai-designer/issues
- **Discussions**: https://github.com/akiraabe/mdai-designer/discussions
- **Email**: [TBD]

*Last updated: June 2025*