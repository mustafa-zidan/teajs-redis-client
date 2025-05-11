/**
 * redis.ts v0.6.0: Simple Redis client for TeaJS
 *
 * @module redis
 * @author Tamer Rizk, Inficron Inc.
 * @author Mustafa Zidan Abuelfadl
 * @copyright 2012-2023 Tamer Rizk, Inficron Inc. and Mustafa Zidan Abuelfadl
 * @license MIT
 */

'use strict';

import * as dgram from 'unix-dgram';
import { RedisOptions } from './types';

/**
 * Default configuration values
 * @private
 */
const DEFAULT_CONFIG: Required<RedisOptions> = {
  socketPath: '/tmp/redis.sock', // Default Unix socket path for Redis
  host: '127.0.0.1',  // Kept for backward compatibility
  port: 6379,         // Kept for backward compatibility
  password: '',
  pw: '',
  db: '0',
  bufsz: 67108864, // 64MB
  debug: false
};

/**
 * Redis client for TeaJS
 */
export class Redis {
  /**
   * Current status message
   */
  public status: string;

  /**
   * Number of rows returned by the last query
   */
  public rows: number;

  /**
   * Debug mode flag
   */
  public debug: boolean;

  /**
   * Buffer size for responses
   */
  public bufsz: number;

  /**
   * Socket connection
   */
  public connection: any;

  /**
   * Queue for pending messages
   * @private
   */
  private messageQueue: any[];

  /**
   * Pending response buffer
   * @private
   */
  private pendingResponse: Buffer | null;

  /**
   * Response callback function
   * @private
   */
  private responseCallback: ((buf: Buffer) => void) | null;

  /**
   * Creates a new Redis client instance
   * 
   * @param params - Configuration parameters
   * @returns Redis client instance or null if connection failed
   */
  constructor(params?: RedisOptions) {
    // Initialize configuration with defaults and provided parameters
    const config = Object.assign({}, DEFAULT_CONFIG);

    if (params) {
      if (typeof params.socketPath !== 'undefined') config.socketPath = params.socketPath;
      if (typeof params.host !== 'undefined') config.host = params.host;
      if (typeof params.port !== 'undefined') config.port = parseInt(String(params.port), 10);
      if (typeof params.password !== 'undefined') config.password = params.password;
      else if (typeof params.pw !== 'undefined') config.password = params.pw;
      if (typeof params.bufsz !== 'undefined') config.bufsz = parseInt(String(params.bufsz), 10);
      if (typeof params.db !== 'undefined') config.db = String(params.db);
      if (typeof params.debug !== 'undefined') config.debug = !!params.debug;
    }

    // Initialize instance properties
    this.status = '';
    this.rows = 0;
    this.debug = config.debug;
    this.bufsz = typeof config.bufsz === 'string' ? parseInt(config.bufsz, 10) : config.bufsz;
    this.connection = null;
    this.messageQueue = [];
    this.pendingResponse = null;
    this.responseCallback = null;

    // Establish connection
    try {
      // Create Unix Domain Socket
      this.connection = dgram.createSocket('unix_dgram');

      // Set up event handlers
      this.connection.on('message', (msg: Buffer) => {
        if (this.debug) {
          system.stderr.write('Received message from Redis server\n');
        }

        if (this.responseCallback) {
          this.responseCallback(msg);
          this.responseCallback = null;
        } else {
          this.pendingResponse = msg;
        }
      });

      this.connection.on('error', (err: Error) => {
        this.status = 'Socket error: ' + (err.message || String(err));
        if (this.debug) {
          system.stderr.write(this.status + '\n');
        }
      });

      // Connect to Redis server via Unix Domain Socket
      try {
        this.connection.bind(null);
        this.connection.connect(config.socketPath);
      } catch (err) {
        this.status = 'Could not connect to Redis server: ' + ((err as Error).message || String(err));
        return null as any; // TypeScript requires a return value, but the original code returns null
      }

      // Authenticate if password is provided
      if (config.password) {
        const authResult = this.query('AUTH ' + config.password);
        if (!this.status.match(/OK/i)) {
          this.disconnect();
          return null as any;
        }
      }

      // Select database
      const selectResult = this.query('SELECT ' + config.db);
      if (!this.status.match(/OK/i)) {
        this.disconnect();
        return null as any;
      }

      // Reset status after successful connection
      this.rows = 0;
      this.status = '';
    } catch (err) {
      this.status = 'Error initializing Redis connection: ' + ((err as Error).message || String(err));
      this.disconnect();
      return null as any;
    }
  }

  /**
   * Quotes a string with specified quote character
   * 
   * @param s - String to quote
   * @param c - Quote character
   * @returns Quoted string
   * @private
   */
  private quote(s: string, c?: string): string {
    const q = typeof c === 'undefined' ? '"' : c;
    // Fix the regex to properly handle quote characters
    const se = new RegExp(`(^[${q}]+)|([${q}]+$)`, 'mg');
    s = s.toString();
    s = s.replace(se, '');
    return q + s + q;
  }

  /**
   * Executes a Redis command
   * 
   * @param q - Redis command to execute
   * @returns Command results or null on error
   */
  public query(q: string): Array<string | number | null> | null {
    // Validate input
    if (!q || !this.connection) {
      this.status = !q ? 'Empty query' : 'No connection';
      return null;
    }

    try {
      let arg: string[] = [];
      let len = 1024; // Safety limit for parsing

      // Clean and normalize the query string
      q = q.replace(/[\u0000\u0001]/g, ' ');
      q = q.replace(/^(?:[\r\n\t]+)|(?:[\r\n\t]+)$/mg, '');
      q = q.replace(/(?:\r\n)+/g, '\\r\\n');

      // Ensure query contains at least one letter
      if (!q.match(/[a-z]/i)) {
        this.status = 'Invalid query format';
        return null;
      }

      // Handle quoted strings in the query
      interface DelimOptions {
        quot: number;
        apos: number;
        quot_chr: string;
        quot_replace: string;
        quot_esc: string;
        quot_match: string;
        apos_chr: string;
        apos_replace: string;
        apos_esc: string;
        apos_match: string;
        [key: string]: string | number; // Index signature for dynamic access
      }

      const delim: DelimOptions = {
        quot: -1, 
        apos: -1, 
        quot_chr: '"', 
        quot_replace: '\u0001', // Use Unicode character instead of \1
        quot_esc: '(\\\\+)"', 
        quot_match: '("[^"]*[ ][^"]*")', 
        apos_chr: "'", 
        apos_replace: '\u0001', // Use Unicode character instead of \1
        apos_esc: "(\\\\+)'", 
        apos_match: "('[^']*[ ][^']*')"
      };

      delim.quot = q.indexOf(' "');
      delim.apos = q.indexOf(" '");

      // Process quoted strings if found
      if (delim.quot > -1 || delim.apos > -1) {
        // Determine which quote type to process first
        const quote = (delim.apos === -1 || (delim.quot !== -1 && delim.apos > delim.quot)) ? 'quot' : 'apos';

        // Create regex patterns for the selected quote type
        const esc_re = new RegExp(delim[quote + '_esc'] as string, 'g');
        const match_re = new RegExp(delim[quote + '_match'] as string);
        const replace_re = new RegExp(delim[quote + '_replace'] as string + '([0-9]+);', 'g');

        // Handle escaped quotes
        q = q.replace(esc_re, (m, n) => delim[quote + '_replace'] as string + n.length + ';');

        // Replace spaces in quoted strings with null bytes to preserve them
        let match: RegExpMatchArray | null;
        while ((match = q.match(match_re)) && match[1] && --len) {
          q = q.replace(match[1], match[1].replace(/[ ]/g, '\0'));
        }

        // Safety check for infinite loops
        if (len <= 1) {
          this.status = 'Query parsing limit exceeded';
          return null;
        }

        // Normalize spaces
        q = q.replace(/[ ][ ][ ]*/g, ' ');

        // Restore escaped quotes
        q = q.replace(replace_re, (m, n) => {
          const count = parseInt(n, 10) || 0;
          return '\\'.repeat(count) + (delim[quote + '_chr'] as string);
        });
      }

      // Split query into arguments
      arg = q.split(' ');
      len = arg.length;

      // Build Redis protocol message (RESP)
      let msg = '*' + len + "\r\n";
      for (let i = 0; i < len; i++) {
        // Restore spaces in quoted strings
        arg[i] = arg[i].replace(/\0/g, ' ');

        // Remove surrounding quotes if present
        if (arg[i].match(/^(["']).*\1$/)) {
          arg[i] = arg[i].replace(/^(['"])|(['"])$/g, '');
        }

        // Add argument to RESP message
        msg += '$' + arg[i].length + "\r\n" + arg[i] + "\r\n";
      }

      // Debug output if enabled
      if (this.debug) {
        system.stderr.write('Redis command: ' + msg + "\n");
      }

      // Send command to Redis server
      this.rows = 0;

      // Create a promise to handle the asynchronous response
      const responsePromise = new Promise<Buffer>((resolve, reject) => {
        // Set up the response callback
        this.responseCallback = (buf: Buffer) => {
          if (!buf) {
            reject(new Error('No response from Redis server'));
          } else {
            resolve(buf);
          }
        };

        // Send the command
        try {
          this.connection.send(Buffer.from(msg), 0, msg.length, this.connection.fd);
        } catch (err) {
          reject(new Error('Failed to send command: ' + ((err as Error).message || String(err))));
        }

        // Check if we already have a pending response
        if (this.pendingResponse) {
          const response = this.pendingResponse;
          this.pendingResponse = null;
          if (this.responseCallback) {
            this.responseCallback(response);
          }
        }
      });

      // Wait for the response
      let buf: Buffer;
      try {
        buf = responsePromise.sync();
      } catch (err) {
        this.status = (err as Error).message || 'Error receiving response';
        return null;
      }

      if (!buf) {
        this.status = 'No response from Redis server';
        return null;
      }

      // Parse response
      const response = buf.toString('utf8').trim();
      const lines = response.split("\r\n");
      const firstLine = lines.shift() || '';

      // Handle different Redis response types

      // Error response
      if (firstLine.startsWith('-')) {
        this.status = firstLine.replace(/^[\- ]+/, '');
        return null;
      }

      // Simple string response
      if (firstLine.startsWith('+')) {
        this.status = firstLine.replace(/^[+ ]+/, '');
        return [];
      }

      // Integer response
      if (firstLine.startsWith(':')) {
        this.status = this.status || 'OK';
        this.rows = 1;
        return [parseInt(firstLine.replace(/^[: ]+/, ''), 10)];
      }

      // Bulk string response
      if (firstLine.startsWith('$')) {
        this.status = this.status || 'OK';
        this.rows = firstLine.match(/^\$\-1/) ? 0 : 1;
        return typeof lines[0] === 'undefined' && this.rows === 1 ? [''] : lines;
      }

      // Array response
      if (firstLine.startsWith('*')) {
        this.status = this.status || 'OK';
        this.rows = parseInt(firstLine.replace(/^[* ]+/, ''), 10);

        // Parse array elements
        const result: Array<string | null> = [];
        let isDataLine = false;
        let validElements = 0;

        for (let i = 0; i < lines.length; i++) {
          isDataLine = !isDataLine;

          if (isDataLine) {
            result.push(lines[i].toString() || '');
            validElements++;
          } else if (lines[i].match(/^\$\-1/)) {
            isDataLine = true;
            validElements++;
            result.push(null);
          }
        }

        // Validate response integrity
        if (validElements !== this.rows) {
          this.status = `Invalid Redis response. Expected ${this.rows} results, but got: ${result.toString()}`;
          this.rows = 0;
          return null;
        }

        return result;
      }

      // Unknown response type
      this.status = 'Unknown Redis response format';
      return null;
    } catch (err) {
      this.status = 'Error executing query: ' + ((err as Error).message || String(err));
      return null;
    }
  }

  /**
   * Closes the Redis connection and resets the state
   */
  public disconnect(): void {
    if (this.connection) {
      try {
        // Clean up event listeners
        this.connection.removeAllListeners('message');
        this.connection.removeAllListeners('error');

        // Close the connection
        this.connection.close();
      } catch (err) {
        // Ignore errors during disconnect
        if (this.debug) {
          system.stderr.write('Error during disconnect: ' + ((err as Error).message || String(err)) + '\n');
        }
      } finally {
        this.connection = null;
        this.pendingResponse = null;
        this.responseCallback = null;
        this.messageQueue = [];
        this.rows = 0;
        this.status = '';
      }
    }
  }
}
