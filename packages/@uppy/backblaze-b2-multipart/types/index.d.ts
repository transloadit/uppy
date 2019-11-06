import Uppy = require('@uppy/core');

declare module BackblazeB2Multipart {
  interface BackblazeB2Part {
    PartNumber?: number;
    Size?: number;
  }

  interface BackblazeB2MultipartOptions extends Uppy.PluginOptions {
    companionUrl: string;
    createMultipartUpload(file: Uppy.UppyFile): Promise<{ fileId: string }>;
    listParts(file: Uppy.UppyFile, opts: { fileId: string }): Promise<BackblazeB2Part[]>;
    getEndpoint(file : Uppy.UppyFile, opts: { fileId: string }): Promise<{ uploadUrl: string, authorizationToken: string}>
    abortMultipartUpload(file: Uppy.UppyFile, opts: { fileId: string }): Promise<void>;
    completeMultipartUpload(file: Uppy.UppyFile, opts: { fileId: string, parts: BackblazeB2Part[] }): Promise<{ fileId?: string }>;
    timeout: number;
    limit: number;
  }
}

declare class BackblazeB2Multipart extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<BackblazeB2Multipart.BackblazeB2MultipartOptions>);
}

export = BackblazeB2Multipart;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof BackblazeB2Multipart, opts: Partial<BackblazeB2Multipart.BackblazeB2MultipartOptions>): Uppy.Uppy;
  }
}
