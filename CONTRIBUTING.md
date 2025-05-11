# Contributing to teajs-redis-client

Thank you for considering contributing to teajs-redis-client! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, considerate, and collaborative.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the issues
- Use the bug report template if available
- Include detailed steps to reproduce the bug
- Include any relevant logs or error messages

### Suggesting Enhancements

- Check if the enhancement has already been suggested in the issues
- Use the feature request template if available
- Clearly describe the enhancement and its benefits
- Consider how it might be implemented

### Pull Requests

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass
6. Submit a pull request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests:
   - Legacy tests: `npm test` (requires Redis server running on Unix socket)
   - Integration tests: `npm run test:integration` (requires Docker)
4. Type check the code: `npm run build`
5. Lint the code: `npm run lint`

## Coding Guidelines

- Follow the existing code style
- Write clear, commented code
- Include tests for new functionality
- Update documentation as needed
- Use TypeScript types when possible
- Use JSDoc comments for documenting code

## Testing Guidelines

### Legacy Tests

Legacy tests in `test/test-redis.js` are designed to run in a TeaJS environment and require a Redis server running on the default Unix socket path (`/tmp/redis.sock`).

### Integration Tests

Integration tests in `test/redis.test.ts` use testcontainers to automatically start a Redis container, run the tests against it, and then stop the container. These tests are written in TypeScript and use Jest as the test framework.

To add a new integration test:

1. Create a new test file in the `test` directory with a `.test.ts` extension
2. Import the necessary modules from testcontainers
3. Use the `beforeAll` and `afterAll` hooks to start and stop the container
4. Write your tests using Jest's `describe`, `test`, and `expect` functions

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT license.
