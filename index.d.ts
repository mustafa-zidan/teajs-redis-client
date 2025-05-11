/**
 * Type definitions for teajs-redis-client
 */

declare module 'teajs-redis-client' {
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

  /**
   * Redis client for TeaJS
   */
  export class Redis {
    /**
     * Creates a new Redis client instance
     * 
     * @param params - Configuration parameters
     * @returns Redis client instance or null if connection failed
     */
    constructor(params?: RedisOptions);

    /**
     * Current status message
     */
    status: string;

    /**
     * Number of rows returned by the last query
     */
    rows: number;

    /**
     * Debug mode flag
     */
    debug: boolean;

    /**
     * Buffer size for responses
     */
    bufsz: number;

    /**
     * Socket connection
     */
    connection: any;

    /**
     * Executes a Redis command
     * 
     * @param q - Redis command to execute
     * @returns Command results or null on error
     */
    query(q: string): Array<string | number | null> | null;

    /**
     * Closes the Redis connection and resets the state
     */
    disconnect(): void;

    /**
     * Quotes a string with specified quote character
     * 
     * @param s - String to quote
     * @param c - Quote character
     * @returns Quoted string
     * @private
     */
    private quote(s: string, c?: string): string;
  }
}

// Add TeaJS-specific global types
declare global {
  namespace NodeJS {
    interface Global {
      system: {
        stdout: {
          writeLine: (message: string) => void;
        };
        stderr: {
          write: (message: string) => void;
        };
      };
    }
  }

  interface Promise<T> {
    sync(): T;
  }
}

export {};