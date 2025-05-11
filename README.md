# teajs-redis-client

*Redis client for TeaJS*

A simple and efficient Redis client for TeaJS applications, providing a lightweight interface to Redis databases.

## Table of Contents

- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Install via npm](#install-via-npm)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Common Redis Operations](#common-redis-operations)
- [API Documentation](#api-documentation)
  - [Redis Constructor](#redis-constructor)
  - [Methods](#methods)
  - [Properties](#properties)
- [Performance Tips](#performance-tips)
- [Troubleshooting](#troubleshooting)
- [Version History](#version-history)
- [Testing](#testing)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Installation

### Prerequisites

- Node.js (>=0.10.0)
- TeaJS environment
- Redis server (for actual use)

### Install via npm

```bash
npm install teajs-redis-client
```

## Usage

### Basic Example

```javascript
var Redis = require('teajs-redis-client').Redis; 

// Create a new Redis connection using Unix Domain Socket
// Both 'password' and 'pw' parameters are supported for specifying the Redis password
var redis = new Redis({
    socketPath: '/tmp/redis.sock', // Path to Redis Unix Domain Socket
    password: config.redis.pw, // or use 'pw' directly
    db: config.redis.db
});

// Execute a Redis command
var keys = redis.query('keys *');
system.stdout.writeLine(redis.status);

// Display results
system.stdout.writeLine(keys.join("\n"));

// Close the connection when done
redis.disconnect();
```

### Common Redis Operations

#### String Operations

```javascript
// Set a string value
redis.query('SET user:1:name "John Doe"');

// Get a string value
var name = redis.query('GET user:1:name');
system.stdout.writeLine(name); // "John Doe"

// Set multiple values
redis.query('MSET user:1:email "john@example.com" user:1:age "30"');

// Get multiple values
var values = redis.query('MGET user:1:name user:1:email user:1:age');
system.stdout.writeLine(values.join(", ")); // "John Doe, john@example.com, 30"
```

#### Hash Operations

```javascript
// Set hash fields
redis.query('HSET user:1 name "John Doe" email "john@example.com" age "30"');

// Get all hash fields
var userInfo = redis.query('HGETALL user:1');
for (var i = 0; i < userInfo.length; i += 2) {
    system.stdout.writeLine(userInfo[i] + ": " + userInfo[i+1]);
}
```

#### List Operations

```javascript
// Push items to a list
redis.query('LPUSH messages "Hello"');
redis.query('LPUSH messages "World"');

// Get list items
var messages = redis.query('LRANGE messages 0 -1');
system.stdout.writeLine(messages.join(" ")); // "World Hello"
```

## API Documentation

### Redis Constructor

Creates a new Redis client instance.

```javascript
var redis = new Redis(options);
```

#### Options

- `socketPath`: Path to Redis Unix Domain Socket (default: '/tmp/redis.sock')
- `host`: Redis server hostname (kept for backward compatibility, default: '127.0.0.1')
- `port`: Redis server port (kept for backward compatibility, default: 6379)
- `password` or `pw`: Redis server password (default: '')
- `db`: Redis database number (default: '0')
- `bufsz`: Buffer size for responses (default: 67108864)
- `debug`: Enable debug mode (default: false)

### Methods

#### query(command)

Executes a Redis command and returns the result.

```javascript
var result = redis.query('SET mykey myvalue');
var value = redis.query('GET mykey');
```

The `query` method supports all Redis commands. The command format follows the Redis protocol syntax.

#### disconnect()

Closes the Redis connection.

```javascript
redis.disconnect();
```

Always call this method when you're done with the Redis connection to properly release resources.

### Properties

- `status`: Contains the status message of the last operation
- `rows`: Number of rows returned by the last query

## Performance Tips

1. **Connection Reuse**: Create a single Redis connection and reuse it for multiple operations instead of creating a new connection for each operation.

2. **Batch Operations**: Use batch operations like MSET, MGET, HMSET, etc. when possible to reduce network overhead.

3. **Pipeline Commands**: For multiple independent commands, consider using pipelining to send multiple commands at once.

4. **Buffer Size**: Adjust the `bufsz` parameter based on your expected response sizes to optimize memory usage.

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Redis server is running
   - Check host and port settings
   - Verify firewall settings

2. **Authentication Failed**
   - Verify password is correct
   - Ensure Redis is configured to require authentication

3. **Out of Memory**
   - Increase `bufsz` parameter if dealing with large datasets
   - Consider using streaming for very large datasets

### Debug Mode

Enable debug mode to see detailed information about Redis commands:

```javascript
var redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
    debug: true
});
```

## Version History

- **v0.4.0** (Current)
  - Switched from 'socket' to 'node-unix-dgram' for Unix Domain Socket support
  - Added support for connecting to Redis via Unix Domain Sockets using the 'socketPath' parameter
  - Improved error handling and connection management
  - Enhanced documentation

- **v0.3.0**
  - Added support for 'pw' parameter as an alias for 'password'
  - Improved documentation
  - Code restructuring to follow Node.js best practices

- **v0.2.0**
  - Initial public release
  - Basic Redis functionality

## Testing

To run the tests:

```bash
npm test
```

The test suite verifies basic functionality and compatibility with Redis server.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Authors

- **Tamer Rizk, Inficron Inc.** - *Initial work*
- **Mustafa Zidan** - *Maintenance and enhancements*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
