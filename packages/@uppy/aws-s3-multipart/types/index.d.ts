import { Plugin, PluginOptions, Uppy, UppyFile } from '@uppy/core';

export interface AwsS3Part {
  PartNumber: number;
  Size: number;
  ETag: string;
}

export interface AwsS3MultipartOptions extends PluginOptions {
  serverUrl: string;
  createMultipartUpload(file: UppyFile): Promise<{uploadId: string, key: string}>;
  listParts(opts: {uploadId: string, key: string}): Promise<AwsS3Part>;
  prepareUploadPart(partData: {uploadId: string, key: string, body: Blob, number: number}): Promise<{url: string}>;
  abortMultipartUpload(opts: {uploadId: string, key: string}): Promise<void>;
  completeMultipartUpload(opts: {uploadId: string, key: string, parts: AwsS3Part[]}): Promise<{location?: string}>;
  timeout: number;
  limit: number;
}

export default class AwsS3Multipart extends Plugin {
  constructor(uppy: Uppy, opts: Partial<AwsS3MultipartOptions>);
}
