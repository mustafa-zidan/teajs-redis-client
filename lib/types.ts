/**
 * Type definitions for Redis client
 */

/**
 * Redis client configuration options
 */
export interface RedisOptions {
  /**
   * Path to Redis Unix Domain Socket
   * @default '/tmp/redis.sock'
   */
  socketPath?: string;
  
  /**
   * Redis server hostname (for backward compatibility)
   * @default '127.0.0.1'
   */
  host?: string;
  
  /**
   * Redis server port (for backward compatibility)
   * @default 6379
   */
  port?: number | string;
  
  /**
   * Redis server password
   * @default ''
   */
  password?: string;
  
  /**
   * Alternative parameter name for password
   * @default ''
   */
  pw?: string;
  
  /**
   * Redis database number
   * @default '0'
   */
  db?: string | number;
  
  /**
   * Buffer size for responses (64MB)
   * @default 67108864
   */
  bufsz?: number | string;
  
  /**
   * Enable debug mode
   * @default false
   */
  debug?: boolean;
}