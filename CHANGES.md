# Changes

## v0.6.0 (Current)

### Overview

Fully migrated the codebase to TypeScript. This update provides type safety, better IDE support, and improved maintainability while maintaining full backward compatibility.

### Major Changes

#### 1. Complete TypeScript Migration

- Converted all JavaScript files to TypeScript
- Moved from CommonJS to ES modules
- Enhanced type definitions with proper interfaces
- Improved error handling with type assertions
- Added comprehensive TypeScript examples

#### 2. Build System Improvements

- Updated build process for TypeScript compilation
- Added proper source mapping
- Configured TypeScript for strict type checking
- Ensured compiled output maintains backward compatibility

## v0.5.0

### Overview

Added TypeScript support and integration testing with testcontainers. This update improves the development experience and makes it easier to test the Redis client without requiring a local Redis server.

### Major Changes

#### 1. TypeScript Support

- Added TypeScript configuration (tsconfig.json)
- Added type definitions for the Redis class (index.d.ts)
- Added JSDoc type annotations to existing code
- Added TypeScript linting support

#### 2. Testing Improvements

- Added testcontainers for Redis integration testing
- Created Jest configuration for running tests
- Added new integration tests in TypeScript
- Updated CI workflow to use testcontainers

#### 3. Development Experience

- Added npm scripts for building, linting, and running tests
- Updated documentation with TypeScript and testcontainers information
- Added detailed contributing guidelines for TypeScript and testing

### Testing

To test the Redis client:

1. Legacy tests (requires Redis server): `npm test`
2. Integration tests with testcontainers (requires Docker): `npm run test:integration`

### Compatibility Notes

This version maintains full backward compatibility with previous versions. The TypeScript types are provided as a development tool and do not affect runtime behavior.

## v0.4.0

### Overview

The Redis client has been updated to use Unix Domain Sockets via the `node-unix-dgram` module instead of TCP/IP sockets via the `socket` module. This change provides better performance and security for local Redis connections.

### Major Changes

#### 1. Dependency Changes

- Replaced `socket` dependency with `node-unix-dgram` (version ^0.2.0)

#### 2. Connection Method

- Added support for connecting to Redis via Unix Domain Sockets using the `socketPath` parameter
- Default socket path is set to `/tmp/redis.sock`
- Kept backward compatibility by maintaining `host` and `port` parameters in the API

#### 3. Implementation Changes

- Rewrote the connection creation and setup to use Unix Domain Sockets
- Implemented event-based message handling for asynchronous communication
- Enhanced error handling and connection management
- Added proper cleanup of event listeners in the disconnect method

#### 4. Documentation Updates

- Updated README.md with information about Unix Domain Socket support
- Added examples of connecting via Unix Domain Sockets
- Updated API documentation to include the new `socketPath` parameter
- Updated version history to reflect the changes
