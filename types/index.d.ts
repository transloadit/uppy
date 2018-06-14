// Type definitions for uppy 0.24
// Project: https://uppy.io
// Definitions by: My Self <https://github.com/me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// TypeScript Version: 2.3

// export as namespace Uppy;

declare module 'uppy' {
	export const Core: Core;
	export const Dashboard: plugins.Dashboard;
	export const DragDrop: plugins.DragDrop;
	export const XHRUpload: plugins.XHRUpload;
	export const GoogleDrive: plugins.GoogleDrive;
	export const Instagram: plugins.Instagram;
	export const Webcam: plugins.Webcam;
	export const Tus: plugins.Tus;
	export const StatusBar: plugins.StatusBar;
	export const Url: plugins.Url;
	export const Dropbox: plugins.Dropbox;
	export const AwsS3: plugins.AwsS3;
	export const GoldenRetriever: plugins.GoldenRetriever;
	export const ThumbnailGenerator: plugins.ThumbnailGenerator;
	export const Transloadit: plugins.Transloadit;
	export const Dummy: plugins.Dummy;
	export const FileInput: plugins.FileInput;
	export const Form: plugins.Form;
	export const Informer: plugins.Informer;
	export const MagicLog: plugins.MagicLog;
	export const ProgressBar: plugins.ProgressBar;
	export const ReduxDevTools: plugins.ReduxDevTools;
}

declare module 'uppy/lib/core' {
	export = Core;
}

declare module 'uppy/lib/plugins/Dashboard' {
	const Dashboard: plugins.Dashboard;
	export = Dashboard;
}

declare module 'uppy/lib/plugins/DragDrop' {
	const DragDrop: plugins.DragDrop;
	export = DragDrop;
}

declare module 'uppy/lib/plugins/XHRUpload' {
	const XHRUpload: plugins.XHRUpload;
	export = XHRUpload;
}

declare module 'uppy/lib/plugins/GoogleDrive' {
	const GoogleDrive: plugins.GoogleDrive;
	export = GoogleDrive;
}

declare module 'uppy/lib/plugins/Instagram' {
	const Instagram: plugins.Instagram;
	export = Instagram;
}

declare module 'uppy/lib/plugins/Webcam' {
	const Webcam: plugins.Webcam;
	export = Webcam;
}

declare module 'uppy/lib/plugins/Tus' {
	const Tus: plugins.Tus;
	export = Tus;
}

declare module 'uppy/lib/plugins/StatusBar' {
	const StatusBar: plugins.StatusBar;
	export = StatusBar;
}

declare module 'uppy/lib/plugins/Url' {
	const Url: plugins.Url;
	export = Url;
}

declare module 'uppy/lib/plugins/Dropbox' {
	const Dropbox: plugins.Dropbox;
	export = Dropbox;
}

declare module 'uppy/lib/plugins/AwsS3' {
	const AwsS3: plugins.AwsS3;
	export = AwsS3;
}

declare module 'uppy/lib/plugins/GoldenRetriever' {
	const GoldenRetriever: plugins.GoldenRetriever;
	export = GoldenRetriever;
}

declare module 'uppy/lib/plugins/ThumbnailGenerator' {
	const ThumbnailGenerator: plugins.ThumbnailGenerator;
	export = ThumbnailGenerator;
}

declare module 'uppy/lib/plugins/Transloadit' {
	const Transloadit: plugins.Transloadit;
	export = Transloadit;
}

declare module 'uppy/lib/plugins/Dummy' {
	const Dummy: plugins.Dummy;
	export = Dummy;
}

declare module 'uppy/lib/plugins/FileInput' {
	const FileInput: plugins.FileInput;
	export = FileInput;
}

declare module 'uppy/lib/plugins/Form' {
	const Form: plugins.Form;
	export = Form;
}

declare module 'uppy/lib/plugins/Informer' {
	const Informer: plugins.Informer;
	export = Informer;
}

declare module 'uppy/lib/plugins/MagicLog' {
	const MagicLog: plugins.MagicLog;
	export = MagicLog;
}

declare module 'uppy/lib/plugins/ProgressBar' {
	const ProgressBar: plugins.ProgressBar;
	export = ProgressBar;
}

declare module 'uppy/lib/plugins/ReduxDevTools' {
	const ReduxDevTools: plugins.ReduxDevTools;
	export = ReduxDevTools;
}

declare namespace Store {
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

declare interface Local {
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

declare namespace plugins {
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
	interface GoogleDriveOptions extends core.CoreConfig {
		expires: number;
		serviceWorker: boolean;
		indexedDB: any;
		serverUrl: string;
	}
	class GoogleDrive extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<GoogleDriveOptions>);
		loadFilesStateFromLocalStorage(): void;
		getWaitingFiles(): { [fileID: string]: File };
		getUploadingFiles(): { [fileID: string]: File };
		saveFilesStateToLocalStorage(): void;
		loadFileBlobsFromServiceWorker(): void;
		loadFileBlobsFromIndexedDB(): void;
		deleteBlobs(): Promise<any>;
	}
	interface InstagramOptions extends core.CoreConfig {
		serverUrl: string;
	}
	class Instagram extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<InstagramOptions>);
	}
	interface WebcamOptions extends core.CoreConfig {
		countdown: boolean;
	}
	interface WebcamMedia {
		source: string;
		name: string;
		data: File;
		type: string;
	}
	class Webcam extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<WebcamOptions>);
		isSupported(): boolean;
		getConstraints(): { audio: boolean; video: boolean; };
		start(): Promise<void>;
		startRecording(): void;
		stopRecording(): Promise<void>;
		stop(): void;
		getVideoElement(): HTMLVideoElement;
		oneTwoThreeSmile(): Promise<void>;
		takeSnapshot(): void;
		getImage(): Promise<WebcamMedia>;
		getVideo(): Promise<WebcamMedia>;
		focus(): void;
	}
	interface TusOptions extends core.CoreConfig {
		limit: number;
		endpoint: string;
		uploadUrl: string;
		useFastRemoteRetry: boolean;
		resume: boolean;
		autoRetry: boolean;
	}
	class Tus extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<TusOptions>);
	}
	interface StatusBarOptions extends core.CoreConfig {
		showProgressDetails: boolean;
		hideUploadButton: boolean;
		hideAfterFinish: boolean;
	}
	class StatusBar extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<StatusBarOptions>);
	}
	interface UrlOptions extends core.CoreConfig {
		serverUrl: string;
	}
	class Url extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<UrlOptions>);
	}
	interface DropboxOptions extends core.CoreConfig {
		serverUrl: string;
	}
	class Dropbox extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<DropboxOptions>);
	}
	interface AwsS3Options extends core.CoreConfig {
		limit: number;
		serverUrl: string;
		timeout: number;
	}
	class AwsS3 extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<AwsS3Options>);
	}
	interface GoldenRetrieverOptions extends core.CoreConfig {
		expires: number;
		serviceWorker: boolean;
		indexedDB: any;
	}
	class GoldenRetriever extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<GoldenRetrieverOptions>);
	}
	interface ThumbnailGeneratorOptions extends core.CoreConfig {
		thumbnailWidth: number;
	}
	class ThumbnailGenerator extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<ThumbnailGeneratorOptions>);
	}
	interface TransloaditOptions extends core.CoreConfig {
		params: any;
		service: string;
		waitForEncoding: boolean;
		waitForMetadata: boolean;
		importFromUploadURLs: boolean;
		alwaysRunAssembly: boolean;
	}
	class Transloadit extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<TransloaditOptions>);
	}
	interface DummyOptions extends core.CoreConfig {
	}
	class Dummy extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<DummyOptions>);
	}
	interface FileInputOptions extends core.CoreConfig {
		pretty: boolean;
		inputName: string;
	}
	class FileInput extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<FileInputOptions>);
	}
	interface FormOptions extends core.CoreConfig {
		getMetaFromForm: boolean;
		addResultToForm: boolean;
		submitOnSuccess: boolean;
		triggerUploadOnSubmit: boolean;
		resultName: string;
	}
	class Form extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<FormOptions>);
	}
	interface TypeColor {
		[type: string]: {
			bg: string | number;
			text: string | number;
		};
	}
	interface InformerOptions extends core.CoreConfig {
		typeColors: TypeColor;
	}
	class Informer extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<InformerOptions>);
	}
	interface MagicLogOptions extends core.CoreConfig {
	}
	class MagicLog extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<MagicLogOptions>);
	}
	interface ProgressBarOptions extends core.CoreConfig {
		hideAfterFinish: boolean;
		fixed: boolean;
	}
	class ProgressBar extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<ProgressBarOptions>);
	}
	interface ReduxDevToolsOptions extends core.CoreConfig {
	}
	class ReduxDevTools extends core.Plugin {
		constructor(uppy: core.Uppy, opts: Partial<ReduxDevToolsOptions>);
	}
}

declare namespace core {
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
		target: string | Plugin;
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
	interface SuccessedFile {
		data: File;
		extension: string;
		id: string;
		isPaused: boolean;
		isRemote: boolean;
		meta: {
			name: string;
			type: string;
		};
		name: string;
		preview: string;
		progress: {
			uploadStarted: number;
			uploadComplete: boolean;
			percentage: number;
			bytesUploaded: number;
			bytesTotal: number;
		};
		remote: string;
		size: number;
		source: string;
		type: string;
		uploadURL: string;
	}
	interface Result {
		failed: any[];
		successful: SuccessedFile[];
	}
	class Uppy {
		constructor(conf: Partial<CoreConfig>);
		on(event: string, callback: (...args: any[]) => any): Uppy;
		on(event: 'upload-success', callback: (fileCount: File, body: any, uploadurl: string) => any): Uppy;
		on(event: 'complete', callback: (result: Result) => void): Uppy;
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
		use(Plugin: plugins.GoogleDrive, opts: Partial<plugins.GoogleDriveOptions>): Uppy;
		use(Plugin: plugins.Instagram, opts: Partial<plugins.InstagramOptions>): Uppy;
		use(Plugin: plugins.Webcam, opts: Partial<plugins.WebcamOptions>): Uppy;
		use(Plugin: plugins.Tus, opts: Partial<plugins.TusOptions>): Uppy;
		use(Plugin: plugins.StatusBar, opts: Partial<plugins.StatusBarOptions>): Uppy;
		use(Plugin: plugins.Url, opts: Partial<plugins.UrlOptions>): Uppy;
		use(Plugin: plugins.Dropbox, opts: Partial<plugins.DropboxOptions>): Uppy;
		use(Plugin: plugins.AwsS3, opts: Partial<plugins.AwsS3Options>): Uppy;
		use(Plugin: plugins.GoldenRetriever, opts: Partial<plugins.GoldenRetrieverOptions>): Uppy;
		use(Plugin: plugins.ThumbnailGenerator, opts: Partial<plugins.ThumbnailGeneratorOptions>): Uppy;
		use(Plugin: plugins.Transloadit, opts: Partial<plugins.TransloaditOptions>): Uppy;
		use(Plugin: plugins.Dummy, opts: Partial<plugins.DummyOptions>): Uppy;
		use(Plugin: plugins.FileInput, opts: Partial<plugins.FileInputOptions>): Uppy;
		use(Plugin: plugins.Form, opts: Partial<plugins.FormOptions>): Uppy;
		use(Plugin: plugins.Informer, opts: Partial<plugins.InformerOptions>): Uppy;
		use(Plugin: plugins.MagicLog, opts: Partial<plugins.MagicLogOptions>): Uppy;
		use(Plugin: plugins.ProgressBar, opts: Partial<plugins.ProgressBarOptions>): Uppy;
		use(Plugin: plugins.ReduxDevTools, opts: Partial<plugins.ReduxDevToolsOptions>): Uppy;
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

interface Core {
	(conf?: Partial<core.CoreConfig>): core.Uppy;
}

declare function Core(conf?: Partial<core.CoreConfig>): core.Uppy;
