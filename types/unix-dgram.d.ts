declare module 'unix-dgram' {
  import { EventEmitter } from 'events';

  interface UnixDgramSocket extends EventEmitter {
    bind(path: string | null): void;
    connect(path: string): void;
    send(buffer: Buffer, offset: number, length: number, fd: number): void;
    close(): void;
    removeAllListeners(event?: string): this;
    fd: number;
  }

  export function createSocket(type: string): UnixDgramSocket;
}