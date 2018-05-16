// Type definitions for uppy 0.24
// Project: https://uppy.io
// Definitions by: My Self <https://github.com/me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// TypeScript Version: 2.3

export as namespace Uppy;

export namespace Store {
	// todo
	type State = any;

	type EventRemover = () => void;

	interface Store {
		getState(): State;
		setState(patch: State): void;
		subscribe(listener: any): EventRemover;
	}

	// todo
	type DefaultStore = Store;
	// todo
	type ReduxStore = Store;
}

export interface Local {
	strings: {
		youCanOnlyUploadX: {
			0: string;
			1: string;
		},
		youHaveToAtLeastSelectX: {
			0: string;
			1: string;
		},
		exceedsSize: string;
		youCanOnlyUploadFileTypes: string;
		uppyServerError: string;
		failedToUpload: string;
		noInternetConnection: string;
		connectedToInternet: string;
	};
}

export namespace plugins {
	interface DashboardOptions extends core.CoreConfig {
		onRequestCloseModal: () => any;
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
		target: string | core.Plugin;
		metaFields: string[];
		plugins: core.Plugin[];
		disableStatusBar: boolean;
		showProgressDetails: boolean;
		hideProgressAfterFinish: boolean;
		disableInformer: boolean;
		disableThumbnailGenerator: boolean;
	}
	class Dashboard extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<DashboardOptions>);
		addTarget(plugin: core.Plugin): HTMLElement;
		hideAllPanels(): void;
		showPanel(id: string): void;
		requestCloseModal(): void;
		getFocusableNodes(): HTMLElement[];
		setFocusToFirstNode(): void;
		setFocusToBrowse(): void;
		maintainFocus(): void;
		openModal(): void;
		closeModal(): void;
		isModalOpen(): boolean;
		onKeydown(event: KeyboardEvent): void;
		handleClickOutside(): void;
		handlePaste(ev: ClipboardEvent): void;
		handleInputChange(ev: Event): void;
		initEvents(): void;
		removeEvents(): void;
		updateDashboardElWidth(): void;
		toggleFileCard(fileId: string): void;
		handleDrop(files: File[] | FileList): void;
		render(state: Store.State): void;
		discoverProviderPlugins(): void;
		install(): void;
		uninstall(): void;
	}
	interface DragDropOptions extends core.CoreConfig {
		target: string | core.Plugin;
		inputName: string;
		allowMultipleFiles: boolean;
		width: string;
		height: string;
		note: string;
	}
	class DragDrop extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<DragDropOptions>);
		checkDragDropSupport(): void;
		handleDrop(files: File[] | FileList): void;
		handleInputChange(ev: Event): void;
		render(state: Store.State): void;
		install(): void;
		uninstall(): void;
	}
	interface FileOptions {
		headers: any;
		[key: string]: any;
	}
	interface ProcessTimeout {
		done(): void;
		process(): void;
	}
	interface FormDataUploadOptions {
		metaFields: string[];
		fieldName: string;
	}
	interface XHRUploadOptions extends core.CoreConfig {
		limit: string;
		bundle: boolean;
		formData: FormData;
		headers: any;
		metaFields: string[];
		fieldName: string;
		timeout: number;
		responseUrlFieldName: string;
		endpoint: string;
		method: 'GET' | 'POST' | 'HEAD';
	}
	class XHRUpload extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<XHRUploadOptions>);
		getOptions(file: File): FileOptions;
		createProgressTimeout(timeout: number, timeoutHandler: any): ProcessTimeout;
		createFormDataUpload(file: File, opts: Partial<FormDataUploadOptions>): FormData;
		createBareUpload(file: File): any;
		upload(file: File, current: number, total: number): Promise<File>;
		uploadRemote(file: File, current: number, total: number): Promise<File>;
		uploadBundle(files: File[] | FileList): Promise<void>;
		uploadBundle(files: File[] | FileList): Promise<{
			successful: File[];
			failed: any;
		}>;
		handleUpload(fileIDs: string[]): Promise<null>;
	}
}

export const Dashboard: plugins.Dashboard;
export const DragDrop: plugins.DragDrop;
export const XHRUpload: plugins.XHRUpload;

export namespace core {
	interface CoreConfig {
		id: string;
		autoProceed: boolean;
		debug: boolean;
		restrictions: {
			maxFileSize: false,
			maxNumberOfFiles: false,
			minNumberOfFiles: false,
			allowedFileTypes: false
		};
		meta: any;
		// onBeforeFileAdded: (currentFile, files) => currentFile,
		// onBeforeUpload: (files) => files,
		locale: Local;
		store: Store.Store;
	}
	class Plugin {
		constructor(uppy: Uppy, opts?: {
			replaceTargetContent?: boolean;
		});
		getPluginState(): Store.State;
		setPluginState(update: any): Store.State;
		update(state?: Store.State): void;
		mount(target: any, plugin: any): void;
		render(state: Store.State): void;
		addTarget(plugin: any): void;
		unmount(): void;
		install(): void;
		uninstall(): void;
	}
	type LogType = 'info' | 'warning' | 'error';
	class Uppy {
		constructor(conf: Partial<CoreConfig>);
		on(event: string, callback: any): Uppy;
		on(event: 'upload-success', callback: (fileCount: File, body: any, uploadurl: string) => any): Uppy;
		off(event: string, callback: any): Uppy;
		updateAll(state: Store.State): void;
		setState(patch: Store.State): void;
		getState(): Store.State;
		readonly state: Store.State;
		setFileState(fileID: string, state: Store.State): void;
		resetProgress(): void;
		addPreProcessor(fn: any): void;
		removePreProcessor(fn: any): void;
		addPostProcessor(fn: any): void;
		removePostProcessor(fn: any): void;
		addUploader(fn: any): void;
		removeUploader(fn: any): void;
		setMeta(data: any): void;
		setFileMeta(fileID: string, data: any): void;
		getFile(fileID: string): File;
		getFiles(): File[];
		addFile(file: File): void;
		removeFile(fileID: string): void;
		pauseResume(fileID: string): boolean;
		pauseAll(): void;
		resumeAll(): void;
		retryAll(): void;
		cancelAll(): void;
		retryUpload(fileID: string): any;
		reset(): void;
		actions(): void;
		updateOnlineStatus(): void;
		getID(): string;
		// use<T extends Plugin>(Plugin: T, opts: any): Uppy;
		use(Plugin: plugins.Dashboard, opts: Partial<plugins.DashboardOptions>): Uppy;
		use(Plugin: plugins.DragDrop, opts: Partial<plugins.DragDropOptions>): Uppy;
		use(Plugin: plugins.XHRUpload, opts: Partial<plugins.XHRUploadOptions>): Uppy;
		getPlugin(name: string): Plugin;
		iteratePlugins(method: any): void;
		removePlugin(instance: Plugin): void;
		close(): void;
		info(message: string | { message: string; details: string; }, type?: LogType, duration?: number): void;
		hideInfo(): void;
		log(msg: string, type?: LogType): void;
		run(): Uppy;
		restore(uploadID: string): Promise<any>;
		addResultData(uploadID: string, data: any): void;
		upload(): Promise<any>;
	}
}

export function Core(conf: Partial<core.CoreConfig>): core.Uppy;
