import Uppy = require('@uppy/core');

interface MetaField {
  id: string;
  name: string;
  placeholder?: string;
}

declare module Dashboard {
  interface DashboardLocale {
    strings: {
      closeModal: string,
      importFrom: string,
      addingMoreFiles: string,
      addMoreFiles: string,
      dashboardWindowTitle: string,
      dashboardTitle: string,
      copyLinkToClipboardSuccess: string,
      copyLinkToClipboardFallback: string,
      copyLink: string,
      link: string,
      fileSource: string,
      done: string,
      back: string,
      addMore: string,
      removeFile: string,
      editFile: string,
      editing: string,
      edit: string,
      finishEditingFile: string,
      saveChanges: string,
      cancel: string,
      myDevice: string,
      dropPasteImport: string,
      dropPaste: string,
      dropHint: string,
      browse: string,
      uploadComplete: string,
      uploadPaused: string,
      resumeUpload: string,
      pauseUpload: string,
      retryUpload: string,
      cancelUpload: string,
      xFilesSelected: {
        0: string,
        1: string,
        2: string
      },
      uploadingXFiles: {
        0: string,
        1: string,
        2: string
      },
      processingXFiles: {
        0: string,
        1: string,
        2: string
      },
      poweredBy: string
    }
  }

  interface DashboardOptions extends Uppy.PluginOptions {
    animateOpenClose: boolean;
    browserBackButtonClose: boolean
    closeAfterFinish: boolean;
    closeModalOnClickOutside: boolean;
    disableInformer: boolean;
    disablePageScrollWhenModalOpen: boolean;
    disableStatusBar: boolean;
    disableThumbnailGenerator: boolean;
    height: string | number;
    hideCancelButton: boolean;
    hidePauseResumeButton: boolean;
    hideProgressAfterFinish: boolean;
    hideRetryButton: boolean;
    hideUploadButton: boolean;
    inline: boolean;
    locale: DashboardLocale;
    metaFields: MetaField[];
    note: string | null;
    onRequestCloseModal: () => void;
    plugins: string[];
    proudlyDisplayPoweredByUppy: boolean;
    showLinkToFileUploadResult: boolean;
    showProgressDetails: boolean;
    showSelectedFiles: boolean;
    target: string;
    thumbnailWidth: number;
    trigger: string;
    width: string | number;
  }
}

declare class Dashboard extends Uppy.Plugin {
  constructor(uppy: Uppy.Uppy, opts: Partial<Dashboard.DashboardOptions>);
  addTarget(plugin: Uppy.Plugin): HTMLElement;
  hideAllPanels(): void;
  openModal(): void;
  closeModal(): void;
  isModalOpen(): boolean;
  render(state: object): void;
  install(): void;
  uninstall(): void;
}

export = Dashboard;

declare module '@uppy/core' {
  export interface Uppy {
    use(pluginClass: typeof Dashboard, opts: Partial<Dashboard.DashboardOptions>): Uppy.Uppy;
  }
}
