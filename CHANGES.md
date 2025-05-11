# Changes in v0.4.0

## Overview

The Redis client has been updated to use Unix Domain Sockets via the `node-unix-dgram` module instead of TCP/IP sockets via the `socket` module. This change provides better performance and security for local Redis connections.

## Major Changes

### 1. Dependency Changes

- Replaced `socket` dependency with `node-unix-dgram` (version ^0.2.0)

### 2. Connection Method

- Added support for connecting to Redis via Unix Domain Sockets using the `socketPath` parameter
- Default socket path is set to `/tmp/redis.sock`
- Kept backward compatibility by maintaining `host` and `port` parameters in the API

### 3. Implementation Changes

- Rewrote the connection creation and setup to use Unix Domain Sockets
- Implemented event-based message handling for asynchronous communication
- Enhanced error handling and connection management
- Added proper cleanup of event listeners in the disconnect method

### 4. Documentation Updates

- Updated README.md with information about Unix Domain Socket support
- Added examples of connecting via Unix Domain Sockets
- Updated API documentation to include the new `socketPath` parameter
- Updated version history to reflect the changes

## Testing

To test the Redis client with Unix Domain Sockets:

1. Ensure Redis is configured to listen on a Unix Domain Socket (typically `/tmp/redis.sock`)
2. Run the tests: `node test/test-redis.js`
3. For basic syntax and structure verification without a Redis server: `node test/mock-test.js`

## Compatibility Notes

This version maintains backward compatibility with previous versions, but it's recommended to use the new `socketPath` parameter for better performance and security when connecting to a local Redis server.

## Future Improvements

- Add support for multiple connection methods (Unix Domain Sockets, TCP/IP, TLS)
- Implement connection pooling for better performance
- Add support for Redis Cluster