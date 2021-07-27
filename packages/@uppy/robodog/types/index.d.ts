import Uppy = require('@uppy/core');
import Transloadit = require('@uppy/transloadit')
import Dashboard = require('@uppy/dashboard')
import Dropbox = require('@uppy/dropbox')
import GoogleDrive = require('@uppy/google-drive')
import Instagram = require('@uppy/instagram');
import Url = require('@uppy/url')
import Webcam = require('@uppy/webcam')
import Onedrive = require('@uppy/onedrive')
import Facebook = require('@uppy/facebook');
import Form = require('@uppy/form')

declare module Robodog {
    type Provider = 'dropbox' | 'google-drive' | 'instagram' | 'url' | 'webcam' | 'onedrive' | 'facebook'

    interface RobodogOptionsBase extends Uppy.UppyOptions {
        providers?: Provider[]
        companionUrl?: string,
        companionAllowedHosts?: string | RegExp | Array<string | RegExp>
        companionHeaders?: object,
        dropbox?: Dropbox.DropboxOptions
        googleDrive?: GoogleDrive.GoogleDriveOptions
        instagram?: Instagram.InstagramOptions
        url?: Url.UrlOptions
        webcam?: Webcam.WebcamOptions,
        onedrive?: Onedrive.OneDriveOptions,
        facebook?: Facebook.FacebookOptions
    }

    type RobodogOptions = RobodogOptionsBase & Transloadit.TransloaditOptions & Dashboard.DashboardOptions

    interface RobodogTransloaditResult extends Transloadit.Result {
        assemblyId: string,
        stepName: string
    }

    interface RobodogResult extends Uppy.UploadResult {
        transloadit: Transloadit.Assembly[],
        results?: RobodogTransloaditResult[]
    }

    function pick(opts: RobodogOptions): Promise<RobodogResult>;

    type RobodogFormOptions = RobodogOptions
        & Pick<Form.FormOptions, 'submitOnSuccess' | 'triggerUploadOnSubmit'>
        & { modal?: boolean, statusbar?: string }

    function form(target: string, opts: RobodogFormOptions): Uppy.Uppy

    function upload(files: (File | Blob & { name: string })[], opts: RobodogOptions): Promise<RobodogResult>;

    function dashboard(target: string, opts: RobodogOptions): Uppy.Uppy;
}


export = Robodog;