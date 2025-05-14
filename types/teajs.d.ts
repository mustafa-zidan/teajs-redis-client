/**
 * Type definitions for TeaJS global objects
 */

declare global {
  /**
   * TeaJS system object for I/O operations
   */
  const system: {
    stdout: {
      writeLine: (message: string) => void;
      write: (message: string) => void;
    };
    stderr: {
      write: (message: string) => void;
    };
  };

  /**
   * Add sync method to Promise for TeaJS compatibility
   */
  interface Promise<T> {
    sync(): T;
  }
}

// This file needs to be a module
export {};