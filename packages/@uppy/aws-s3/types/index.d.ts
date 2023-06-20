import { AwsS3MultipartOptions } from '@uppy/aws-s3-multipart'
import type { BasePlugin } from '@uppy/core'

type MaybePromise<T> = T | Promise<T>

export interface AwsS3UploadParameters {
    method?: string
    url: string
    fields?: { [type: string]: string }
    headers?: { [type: string]: string }
}

export interface AwsS3Options extends AwsS3MultipartOptions {
    /** @deprecated future versions of this plugin will use the Expires value from the backend */
    timeout?: number
}

declare class AwsS3 extends BasePlugin<AwsS3Options> {}

export default AwsS3
