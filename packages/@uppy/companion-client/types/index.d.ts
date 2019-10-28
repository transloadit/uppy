export interface RequestClientOptions {
  companionUrl: string;
  companionHeaders?: object;
  /**
   * Deprecated, use `companionHeaders` instead.
   */
  serverHeaders?: object;
}

export class RequestClient {
  constructor (uppy: any, opts: RequestClientOptions);
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
  constructor (uppy: any, opts: ProviderOptions);
  checkAuth (): Promise<boolean>;
  authUrl (): string;
  fileUrl (id: string): string;
  list (directory: string): Promise<any>;
  logout (redirect?: string): Promise<any>;
  static initPlugin(plugin: any, opts: object, defaultOpts?: object): void;
}

export interface SocketOptions {
  target: string;
  autoOpen?: boolean;
}

export class Socket {
  isOpen: boolean;

  constructor (opts: SocketOptions);
  open (): void;
  close (): void;
  send (action: string, payload: any): void;
  on (action: string, handler: (param: any) => void): void;
  once (action: string, handler: (param: any) => void): void;
  emit (action: string, payload: (param: any) => void): void;
}
