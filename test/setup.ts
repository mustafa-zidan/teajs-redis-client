/**
 * Jest setup file
 * 
 * This file is executed before running tests.
 * It's used to set up the test environment.
 */

// Increase timeout for tests using testcontainers
jest.setTimeout(30000);

// Mock TeaJS-specific globals if they don't exist
if (typeof (global as any).system === 'undefined') {
  (global as any).system = {
    stdout: {
      writeLine: (message: string) => console.log(message)
    },
    stderr: {
      write: (message: string) => console.error(message)
    }
  };
}

// Add Promise.sync method for TeaJS compatibility
if (typeof Promise.prototype.sync === 'undefined') {
  Promise.prototype.sync = function() {
    let result: any;
    let error: any;

    this.then(
      (value: any) => { result = value; },
      (err: any) => { error = err; }
    );

    if (error) throw error;
    return result;
  };
}
