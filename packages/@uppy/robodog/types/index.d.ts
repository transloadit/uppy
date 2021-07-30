import type { Uppy, UppyOptions, UploadResult } from '@uppy/core'
import type { Assembly, Result, TransloaditOptions } from '@uppy/transloadit'
import type { DashboardOptions } from '@uppy/dashboard'
import type { DropboxOptions } from '@uppy/dropbox'
import type { GoogleDriveOptions } from '@uppy/google-drive'
import type { InstagramOptions } from '@uppy/instagram'
import type { UrlOptions } from '@uppy/url'
import type { WebcamOptions } from '@uppy/webcam'
import type { OneDriveOptions } from '@uppy/onedrive'
import type { FacebookOptions } from '@uppy/facebook'
import type { FormOptions } from '@uppy/form'

type Provider =
  | 'dropbox'
  | 'google-drive'
  | 'instagram'
  | 'url'
  | 'webcam'
  | 'onedrive'
  | 'facebook'

interface RobodogOptionsBase extends UppyOptions {
  providers?: Provider[];
  companionUrl?: string;
  companionAllowedHosts?: string | RegExp | Array<string | RegExp>;
  companionHeaders?: Record<string, string>;
  dropbox?: DropboxOptions;
  googleDrive?: GoogleDriveOptions;
  instagram?: InstagramOptions;
  url?: UrlOptions;
  webcam?: WebcamOptions;
  onedrive?: OneDriveOptions;
  facebook?: FacebookOptions;
}

export type RobodogOptions = RobodogOptionsBase & TransloaditOptions & DashboardOptions;

interface RobodogTransloaditResult extends Result {
  assemblyId: string;
  stepName: string;
}

interface RobodogResult extends UploadResult {
  transloadit: Assembly[];
  results?: RobodogTransloaditResult[];
}

export function pick(opts: RobodogOptions): Promise<RobodogResult>;

type RobodogFormOptions =
  RobodogOptions &
  Pick<FormOptions, 'submitOnSuccess' | 'triggerUploadOnSubmit'> & {
    modal?: boolean;
    statusbar?: string;
  };

export function form(target: string, opts: RobodogFormOptions): Uppy;

export function upload(
  files: (File | (Blob & { name: string }))[],
  opts: RobodogOptions
): Promise<RobodogResult>;

export function dashboard(target: string, opts: RobodogOptions): Uppy;

export const VERSION: string
