import Uppy = require('@uppy/core');

declare module Transloadit {
  interface AssemblyParameters {
    auth: { key: string };
    template_id?: string;
    steps?: { [step: string]: object };
    notify_url?: string;
    fields?: { [name: string]: number | string };
  }

  interface AssemblyOptions {
    params: AssemblyParameters;
    fields?: { [name: string]: number | string };
    signature?: string;
  }

  interface TransloaditOptionsBase extends Uppy.PluginOptions {
    service?: string;
    waitForEncoding?: boolean;
    waitForMetadata?: boolean;
    importFromUploadURLs?: boolean;
    alwaysRunAssembly?: boolean;
  }

  // Either have a getAssemblyOptions() that returns an AssemblyOptions, *or* have them embedded in the options
  type  TransloaditOptions = TransloaditOptionsBase & (
    | { getAssemblyOptions?: (file: Uppy.UppyFile) => AssemblyOptions | Promise<AssemblyOptions> }
    | AssemblyOptions
  )
}

declare class Transloadit extends Uppy.Plugin<Transloadit.TransloaditOptions> {}

export = Transloadit;
