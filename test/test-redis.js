/**
 * Test file for redis.js
 * 
 * This script tests the Redis client functionality with different configurations.
 * It tests both TCP/IP connections (host/port) and Unix Domain Socket connections (socketPath).
 */

// Import the Redis class
var Redis = require('../lib/redis').Redis;

// Helper function to run tests
function runTest(name, testFn) {
    try {
        system.stdout.writeLine("Running test: " + name);
        testFn();
        system.stdout.writeLine("✓ Test passed: " + name);
    } catch (e) {
        system.stdout.writeLine("✗ Test failed: " + name);
        system.stdout.writeLine("  Error: " + (e.message || e));
    }
    system.stdout.writeLine("");
}

// Test with Unix Domain Socket
runTest("Connect with Unix Domain Socket", function() {
    var redis = new Redis({socketPath:'/tmp/redis.sock'});
    if (!redis) {
        throw new Error("Failed to connect with Unix Domain Socket");
    }
    redis.disconnect();
});

// Test with password parameter
runTest("Connect with 'password' parameter", function() {
    var redis = new Redis({socketPath:'/tmp/redis.sock', password:'test_password'});
    if (!redis) {
        throw new Error("Failed to connect with 'password' parameter");
    }
    redis.disconnect();
});

// Test with pw parameter
runTest("Connect with 'pw' parameter", function() {
    var redis = new Redis({socketPath:'/tmp/redis.sock', pw:'test_password'});
    if (!redis) {
        throw new Error("Failed to connect with 'pw' parameter");
    }
    redis.disconnect();
});

// Test the example from README
runTest("README example", function() {
    var config = {
        redis: {
            socketPath: '/tmp/redis.sock',
            pw: '',
            db: 0
        }
    };

    var redis = new Redis({
        socketPath: config.redis.socketPath,
        password: config.redis.pw, 
        db: config.redis.db
    });

    if (!redis) {
        throw new Error("README example failed to connect");
    }

    redis.disconnect();
});

// Test basic Redis operations if a connection can be established
runTest("Basic Redis operations", function() {
    var redis = new Redis({
        socketPath: '/tmp/redis.sock'
    });

    if (!redis) {
        throw new Error("Failed to connect to Redis server");
    }

    try {
        // Test SET command
        var setResult = redis.query('SET test_key "Hello, Redis!"');
        if (redis.status !== 'OK') {
            throw new Error("SET command failed: " + redis.status);
        }

        // Test GET command
        var getResult = redis.query('GET test_key');
        if (!getResult || getResult[0] !== 'Hello, Redis!') {
            throw new Error("GET command returned unexpected result: " + getResult);
        }

        // Test DEL command
        redis.query('DEL test_key');

        system.stdout.writeLine("  Basic Redis operations completed successfully");
    } finally {
        redis.disconnect();
    }
});
