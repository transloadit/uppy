import Uppy = require('@uppy/core');

declare module AwsS3 {
  interface AwsS3UploadParameters {
    method?: string;
    url: string;
    fields?: { [type: string]: string };
    headers?: { [type: string]: string };
  }

  interface AwsS3Options extends Uppy.PluginOptions {
    serverUrl: string;
    getUploadParameters(file: Uppy.UppyFile): Promise<AwsS3UploadParameters>;
    timeout: number;
    limit: number;
  }
}

declare class AwsS3 extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<AwsS3.AwsS3Options>);
}

export = AwsS3;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof AwsS3, opts: Partial<AwsS3.AwsS3Options>): Uppy.Uppy;
  }
}
