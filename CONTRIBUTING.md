# Contributing to Ultimate Vibe Coder

First off, thank you for considering contributing to Ultimate Vibe Coder! It's people like you that make open-source software such a great community to learn, inspire, and create.

## 🤝 How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Ensure the bug was not already reported by searching on GitHub under Issues.
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements
This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Open a new issue with a clear title and description.
- Provide specific examples to demonstrate the steps or context.
- Explain why this enhancement would be useful to most users.

### Pull Requests
- Fill in the required template.
- Do not include issue numbers in the PR title.
- Follow the JavaScript/TypeScript coding conventions used throughout the project.
- Ensure that the build is green `npm run build` and there are no TypeScript errors `npx tsc --noEmit`.
- Document new code.

## 🧑‍💻 Development Setup

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Start the WebSocket Server: `npm run ws:start`
4. Start the Next.js Dev Server: `npm run dev`

## 🎨 Styleguides

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### TypeScript Guidelines
- Use strictly typed definitions. Avoid `any` where possible.
- Components should be modular and utilize the glassmorphism CSS tokens defined in `globals.css`.
- Rely on `logger` from `@/lib/logger.ts` rather than `console.log` for debugging.

Thank you for contributing! 🚀
