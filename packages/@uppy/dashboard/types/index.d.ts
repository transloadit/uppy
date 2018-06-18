import { Plugin, PluginOptions, Uppy } from '@uppy/core';

declare module '@uppy/dashboard' {
  export interface DashboardOptions extends PluginOptions {
    onRequestCloseModal: () => void;
    disablePageScrollWhenModalOpen: boolean;
    closeModalOnClickOutside: boolean;
    trigger: string | HTMLElement;
    inline: boolean;
    defaultTabIcon: string;
    hideUploadButton: boolean;
    width: string;
    height: string;
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

  export default class Dashboard extends Plugin {
    constructor(uppy: Uppy, opts: Partial<DashboardOptions>);
    addTarget(plugin: Plugin): HTMLElement;
    hideAllPanels(): void;
    openModal(): void;
    closeModal(): void;
    isModalOpen(): boolean;
    render(state: object): void;
    install(): void;
    uninstall(): void;
  }
}
