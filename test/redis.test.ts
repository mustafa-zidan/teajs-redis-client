/**
 * Integration tests for Redis client using testcontainers
 */

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import * as fs from 'fs';
import * as path from 'path';
import { Redis, RedisOptions } from '../index';

describe('Redis Client Integration Tests', () => {
  let container: StartedTestContainer;
  let redisPort: number;
  let redisHost: string;

  // Start Redis container before all tests
  beforeAll(async () => {
    // Start Redis container
    container = await new GenericContainer('redis:latest')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start();

    // Get container connection details
    redisPort = container.getMappedPort(6379);
    redisHost = container.getHost();

    console.log(`Redis container started at ${redisHost}:${redisPort}`);
  });

  // Stop Redis container after all tests
  afterAll(async () => {
    if (container) {
      await container.stop();
      console.log('Redis container stopped');
    }
  });

  // Test connection with host/port
  test('should connect with host/port', () => {
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
    });

    expect(redis).not.toBeNull();
    if (redis) {
      redis.disconnect();
    }
  });

  // Test with password parameter (mock)
  test('should handle password parameter', () => {
    // This is a mock test since we're not setting a password on the container
    // In a real scenario, you would set a password on the Redis container
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: '',
    });

    expect(redis).not.toBeNull();
    if (redis) {
      redis.disconnect();
    }
  });

  // Test with pw parameter (mock)
  test('should handle pw parameter', () => {
    // This is a mock test since we're not setting a password on the container
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      pw: '',
    });

    expect(redis).not.toBeNull();
    if (redis) {
      redis.disconnect();
    }
  });

  // Test basic Redis operations
  test('should perform basic Redis operations', () => {
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
    });

    expect(redis).not.toBeNull();
    
    if (redis) {
      try {
        // Test SET command
        const setResult = redis.query('SET test_key "Hello, Redis!"');
        expect(redis.status).toBe('OK');

        // Test GET command
        const getResult = redis.query('GET test_key');
        expect(getResult).not.toBeNull();
        expect(getResult?.[0]).toBe('Hello, Redis!');

        // Test DEL command
        redis.query('DEL test_key');
      } finally {
        redis.disconnect();
      }
    }
  });

  // Test multiple commands
  test('should handle multiple commands', () => {
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
    });

    expect(redis).not.toBeNull();
    
    if (redis) {
      try {
        // Set multiple keys
        redis.query('SET key1 "value1"');
        redis.query('SET key2 "value2"');
        redis.query('SET key3 "value3"');

        // Get multiple keys
        const keys = redis.query('KEYS key*');
        expect(keys).not.toBeNull();
        expect(keys?.length).toBeGreaterThanOrEqual(3);

        // Clean up
        redis.query('DEL key1 key2 key3');
      } finally {
        redis.disconnect();
      }
    }
  });

  // Test error handling
  test('should handle errors gracefully', () => {
    const redis = new Redis({
      host: redisHost,
      port: redisPort,
    });

    expect(redis).not.toBeNull();
    
    if (redis) {
      try {
        // Invalid command
        const result = redis.query('INVALID_COMMAND');
        expect(result).toBeNull();
        expect(redis.status).toContain('ERR');
      } finally {
        redis.disconnect();
      }
    }
  });
});