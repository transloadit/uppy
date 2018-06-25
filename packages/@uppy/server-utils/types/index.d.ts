import { Uppy } from '@uppy/core';

export interface RequestClientOptions {
  serverUrl: string;
}

export class RequestClient {
  constructor (uppy: Uppy, opts: RequestClientOptions);
  get (path: string): Promise<any>;
  post (path: string, data: object): Promise<any>;
  delete (path: string, data: object): Promise<any>;
}

export interface ProviderOptions {
  serverUrl: string;
  provider: string;
  authProvider?: string;
  name?: string;
}

export class Provider extends RequestClient {
  constructor (uppy: Uppy, opts: ProviderOptions);
  checkAuth (): Promise<boolean>;
  authUrl (): string;
  fileUrl (id: string): string;
  list (directory: string): Promise<any>;
  logout (redirect?: string): Promise<any>;
}

export interface SocketOptions {
  target: string;
}

export class Socket {
  constructor (opts: SocketOptions);
  close (): void;
  send (action: string, payload: any): void;
  on (action: string, handler: (any) => void);
  emit (action: string, payload: (any) => void);
  once (action: string, handler: (any) => void);
}
