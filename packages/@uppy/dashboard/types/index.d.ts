import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module Dashboard {
  interface DashboardOptions extends PluginOptions {
    onRequestCloseModal: () => void;
    disablePageScrollWhenModalOpen: boolean;
    closeModalOnClickOutside: boolean;
    trigger: string | HTMLElement;
    inline: boolean;
    defaultTabIcon: string;
    hideUploadButton: boolean;
    width: string | number;
    height: string | number;
    note: string;
    showLinkToFileUploadResult: boolean;
    proudlyDisplayPoweredByUppy: boolean;
    metaFields: string[];
    plugins: string[];
    disableStatusBar: boolean;
    showProgressDetails: boolean;
    hideProgressAfterFinish: boolean;
    disableInformer: boolean;
    disableThumbnailGenerator: boolean;
  }
}

declare class Dashboard extends Plugin {
  constructor(uppy: Uppy, opts: Partial<Dashboard.DashboardOptions>);
  addTarget(plugin: Plugin): HTMLElement;
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
    use(pluginClass: typeof Dashboard, opts: Partial<Dashboard.DashboardOptions>): Uppy;
  }
}
