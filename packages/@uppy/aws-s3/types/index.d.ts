import { Plugin, PluginOptions, Uppy, UppyFile } from '@uppy/core';

export interface AwsS3UploadParameters {
  method?: string;
  url: string;
  fields?: { [type: string]: string };
  headers?: { [type: string]: string };
}

export interface AwsS3Options extends PluginOptions {
  serverUrl: string;
  getUploadParameters(file: UppyFile): Promise<AwsS3UploadParameters>;
  timeout: number;
  limit: number;
}

export default class AwsS3 extends Plugin {
  constructor(uppy: Uppy, opts: Partial<AwsS3Options>);
}
