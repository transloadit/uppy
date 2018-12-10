import Uppy = require('@uppy/core');

export interface RequestClientOptions {
  serverUrl: string;
  serverHeaders?: object;
}

export class RequestClient {
  constructor (uppy: Uppy.Uppy, opts: RequestClientOptions);
  get (path: string): Promise<any>;
  post (path: string, data: object): Promise<any>;
  delete (path: string, data: object): Promise<any>;
}

export interface ProviderOptions extends RequestClientOptions {
  provider: string;
  authProvider?: string;
  name?: string;
}

export class Provider extends RequestClient {
  constructor (uppy: Uppy.Uppy, opts: ProviderOptions);
  checkAuth (): Promise<boolean>;
  authUrl (): string;
  fileUrl (id: string): string;
  list (directory: string): Promise<any>;
  logout (redirect?: string): Promise<any>;
  static initPlugin(plugin: Uppy.Plugin, opts: object, defaultOpts?: object): void;
}

export interface SocketOptions {
  target: string;
}

export class Socket {
  constructor (opts: SocketOptions);
  close (): void;
  send (action: string, payload: any): void;
  on (action: string, handler: (param: any) => void): void;
  once (action: string, handler: (param: any) => void): void;
  emit (action: string, payload: (param: any) => void): void;
}
