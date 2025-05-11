/**
 * redis.js v0.4.0: Simple Redis client for TeaJS
 *
 * @module redis
 * @author Tamer Rizk, Inficron Inc.
 * @author Mustafa Zidan Abuelfadl
 * @copyright 2012-2023 Tamer Rizk, Inficron Inc. and Mustafa Zidan Abuelfadl
 * @license MIT
 */

'use strict';

/**
 * Unix Domain Socket module for network communication
 * @private
 */
const dgram = require('node-unix-dgram');

/**
 * Default configuration values
 * @private
 */
const DEFAULT_CONFIG = {
  socketPath: '/tmp/redis.sock', // Default Unix socket path for Redis
  host: '127.0.0.1',  // Kept for backward compatibility
  port: 6379,         // Kept for backward compatibility
  password: '',
  db: '0',
  bufsz: 67108864, // 64MB
  debug: false
};

/**
 * Redis client for TeaJS
 * @class
 */
class Redis {
  /**
   * Creates a new Redis client instance
   * 
   * @param {Object} params - Configuration parameters
   * @param {string} [params.socketPath='/tmp/redis.sock'] - Path to Redis Unix Domain Socket
   * @param {string} [params.host='127.0.0.1'] - Redis server hostname (for backward compatibility)
   * @param {number|string} [params.port=6379] - Redis server port (for backward compatibility)
   * @param {string} [params.password=''] - Redis server password
   * @param {string} [params.pw=''] - Alternative parameter name for password
   * @param {string} [params.db='0'] - Redis database number
   * @param {number|string} [params.bufsz=67108864] - Buffer size for responses (64MB)
   * @param {boolean} [params.debug=false] - Enable debug mode
   * @returns {Redis|null} Redis client instance or null if connection failed
   */
  constructor(params) {
    // Initialize configuration with defaults and provided parameters
    const config = Object.assign({}, DEFAULT_CONFIG);

    if (params) {
      if (typeof params.socketPath !== 'undefined') config.socketPath = params.socketPath;
      if (typeof params.host !== 'undefined') config.host = params.host;
      if (typeof params.port !== 'undefined') config.port = parseInt(params.port, 10);
      if (typeof params.password !== 'undefined') config.password = params.password;
      else if (typeof params.pw !== 'undefined') config.password = params.pw;
      if (typeof params.bufsz !== 'undefined') config.bufsz = parseInt(params.bufsz, 10);
      if (typeof params.db !== 'undefined') config.db = params.db;
      if (typeof params.debug !== 'undefined') config.debug = !!params.debug;
    }

    // Initialize instance properties
    this.status = '';
    this.rows = 0;
    this.debug = config.debug;
    this.bufsz = config.bufsz;
    this.connection = null;

    // Establish connection
    try {
      // Initialize message handling
      this.messageQueue = [];
      this.pendingResponse = null;
      this.responseCallback = null;

      // Create Unix Domain Socket
      this.connection = dgram.createSocket('unix_dgram');

      // Set up event handlers
      this.connection.on('message', (msg, rinfo) => {
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

      this.connection.on('error', (err) => {
        this.status = 'Socket error: ' + (err.message || err);
        if (this.debug) {
          system.stderr.write(this.status + '\n');
        }
      });

      // Connect to Redis server via Unix Domain Socket
      try {
        this.connection.bind(null);
        this.connection.connect(config.socketPath);
      } catch (err) {
        this.status = 'Could not connect to Redis server: ' + (err.message || err);
        return null;
      }

      // Authenticate if password is provided
      if (config.password) {
        const authResult = this.query('AUTH ' + config.password);
        if (!this.status.match(/OK/i)) {
          this.disconnect();
          return null;
        }
      }

      // Select database
      const selectResult = this.query('SELECT ' + config.db);
      if (!this.status.match(/OK/i)) {
        this.disconnect();
        return null;
      }

      // Reset status after successful connection
      this.rows = 0;
      this.status = '';
    } catch (err) {
      this.status = 'Error initializing Redis connection: ' + (err.message || err);
      this.disconnect();
      return null;
    }
  }

  /**
   * Quotes a string with specified quote character
   * 
   * @param {string} s - String to quote
   * @param {string} [c='"'] - Quote character
   * @returns {string} Quoted string
   * @private
   */
  quote(s, c) {
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
   * @param {string} q - Redis command to execute
   * @returns {Array|null} Command results or null on error
   * @public
   */
  query(q) {
    // Validate input
    if (!q || !this.connection) {
      this.status = !q ? 'Empty query' : 'No connection';
      return null;
    }

    try {
      let arg = [];
      let len = 1024; // Safety limit for parsing

      // Clean and normalize the query string
      q = q.replace(/[\0\1]/g, ' ');
      q = q.replace(/^(?:[\r\n\t]+)|(?:[\r\n\t]+)$/mg, '');
      q = q.replace(/(?:\r\n)+/g, '\\r\\n');

      // Ensure query contains at least one letter
      if (!q.match(/[a-z]/i)) {
        this.status = 'Invalid query format';
        return null;
      }

      // Handle quoted strings in the query
      const delim = {
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
        const esc_re = new RegExp(delim[quote + '_esc'], 'g');
        const match_re = new RegExp(delim[quote + '_match']);
        const replace_re = new RegExp(delim[quote + '_replace'] + '([0-9]+);', 'g');

        // Handle escaped quotes
        q = q.replace(esc_re, (m, n) => delim[quote + '_replace'] + n.length + ';');

        // Replace spaces in quoted strings with null bytes to preserve them
        while ((arg = q.match(match_re)) && arg[1] && --len) {
          q = q.replace(arg[1], arg[1].replace(/[ ]/g, '\0'));
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
          return '\\'.repeat(count) + delim[quote + '_chr'];
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
      const responsePromise = new Promise((resolve, reject) => {
        // Set up the response callback
        this.responseCallback = (buf) => {
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
          reject(new Error('Failed to send command: ' + (err.message || err)));
        }

        // Check if we already have a pending response
        if (this.pendingResponse) {
          const response = this.pendingResponse;
          this.pendingResponse = null;
          this.responseCallback(response);
        }
      });

      // Wait for the response
      let buf;
      try {
        buf = responsePromise.sync();
      } catch (err) {
        this.status = err.message || 'Error receiving response';
        return null;
      }

      if (!buf) {
        this.status = 'No response from Redis server';
        return null;
      }

      // Parse response
      const response = buf.toString('utf8').trim();
      const lines = response.split("\r\n");
      const firstLine = lines.shift();

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
        const result = [];
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
      this.status = 'Error executing query: ' + (err.message || err);
      return null;
    }
  }

  /**
   * Closes the Redis connection and resets the state
   * 
   * @public
   */
  disconnect() {
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
          system.stderr.write('Error during disconnect: ' + (err.message || err) + '\n');
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

// Export the Redis class
exports.Redis = Redis;
