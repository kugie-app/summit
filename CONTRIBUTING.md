# Contributing to Summit

Thank you for considering contributing to Summit! We're excited to have you join our community of contributors. This document outlines the process for contributing to the project and how you can get involved.

## Ways to Contribute

There are several ways you can contribute to the Summit project:

- Reporting bugs and issues
- Suggesting new features or enhancements
- Improving documentation
- Submitting code changes and fixes
- Helping other users in discussions

## Getting Started

### Setting Up Your Development Environment

Before you start contributing, make sure you have set up your local development environment:

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/summit.git
   cd summit
   ```
3. Set up the project by following the step-by-step instructions in the README.md:
   - Install Node.js (v18 or later recommended)
   - Install pnpm (or npm/yarn)
   - Set up PostgreSQL Database
   - Set up Minio Server (or other S3-compatible storage)
   - Install dependencies: `pnpm install`
   - Configure environment variables by copying `.env.example` to `.env` and filling in the required values
   - Set up the database: `pnpm db:push`
   - Run the development server: `pnpm dev`

### Creating a Branch

For each contribution, create a new branch:

```bash
git checkout -b my-contribution
```

Use a descriptive name for your branch that reflects the changes you're making.

## Pull Request Process

1. **Make your changes**: Implement your bug fix or feature.
2. **Test your changes**: Ensure your changes work as expected and don't break existing functionality.
3. **Commit your changes**: Use clear and descriptive commit messages.
   ```bash
   git commit -m "Fix: resolved issue with invoice generation"
   ```
4. **Push to your fork**:
   ```bash
   git push origin my-contribution
   ```
5. **Submit a Pull Request**: Go to the original Summit repository and create a new pull request from your branch.
   - Provide a clear description of the changes
   - Reference any related issues using the GitHub issue number (e.g., "Fixes #123")

Our team will review your code as soon as possible. We may ask for changes or improvements before merging.

## Reporting Issues

If you find a bug or want to request a new feature:

1. Check if the issue already exists in the [GitHub Issues](https://github.com/kugie-app/summit/issues).
2. If not, create a new issue with a clear title and description.
3. For bugs, include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details (browser, OS, etc.)

## Code Style and Guidelines

- Follow the existing code style in the project
- Write clean, readable, and well-documented code
- Include comments where necessary
- Write meaningful commit messages
- Write or update tests for your changes when applicable

## Communication

You can reach out to the maintainers at [Kugie.app](https://www.kugie.app/contact) if you have any questions or need guidance on your contribution.

## License

By contributing to Summit, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for your contributions and for helping make Summit better for everyone!
