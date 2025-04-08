/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Locale } from '@uppy/utils/lib/Translator'

const en_US: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

en_US.strings = {
  addBulkFilesFailed: {
    '0': 'Failed to add %{smart_count} file due to an internal error',
    '1': 'Failed to add %{smart_count} files due to internal errors',
  },
  addedNumFiles: 'Added %{numFiles} file(s)',
  addingMoreFiles: 'Adding more files',
  additionalRestrictionsFailed:
    '%{count} additional restrictions were not fulfilled',
  addMore: 'Add more',
  addMoreFiles: 'Add more files',
  aggregateExceedsSize:
    'You selected %{size} of files, but maximum allowed size is %{sizeAllowed}',
  allFilesFromFolderNamed: 'All files from folder %{name}',
  allowAccessDescription:
    'In order to take pictures or record video with your camera, please allow camera access for this site.',
  allowAccessTitle: 'Please allow access to your camera',
  allowAudioAccessDescription:
    'In order to record audio, please allow microphone access for this site.',
  allowAudioAccessTitle: 'Please allow access to your microphone',
  aspectRatioLandscape: 'Crop landscape (16:9)',
  aspectRatioPortrait: 'Crop portrait (9:16)',
  aspectRatioSquare: 'Crop square',
  authAborted: 'Authentication aborted',
  authenticate: 'Connect',
  authenticateWith: 'Connect to %{pluginName}',
  authenticateWithTitle:
    'Please authenticate with %{pluginName} to select files',
  back: 'Back',
  browse: 'browse',
  browseFiles: 'browse files',
  browseFolders: 'browse folders',
  cancel: 'Cancel',
  cancelUpload: 'Cancel upload',
  chooseFiles: 'Choose files',
  closeModal: 'Close Modal',
  companionError: 'Connection with Companion failed',
  companionUnauthorizeHint:
    'To unauthorize to your %{provider} account, please go to %{url}',
  complete: 'Complete',
  compressedX: 'Saved %{size} by compressing images',
  compressingImages: 'Compressing images...',
  connectedToInternet: 'Connected to the Internet',
  copyLink: 'Copy link',
  copyLinkToClipboardFallback: 'Copy the URL below',
  copyLinkToClipboardSuccess: 'Link copied to clipboard.',
  creatingAssembly: 'Preparing upload...',
  creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
  dashboardTitle: 'Uppy Dashboard',
  dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
  dataUploadedOfTotal: '%{complete} of %{total}',
  dataUploadedOfUnknown: '%{complete} of unknown',
  discardRecordedFile: 'Discard recorded file',
  done: 'Done',
  dropHereOr: 'Drop here or %{browse}',
  dropHint: 'Drop your files here',
  dropPasteBoth: 'Drop files here, %{browseFiles} or %{browseFolders}',
  dropPasteFiles: 'Drop files here or %{browseFiles}',
  dropPasteFolders: 'Drop files here or %{browseFolders}',
  dropPasteImportBoth:
    'Drop files here, %{browseFiles}, %{browseFolders} or import from:',
  dropPasteImportFiles: 'Drop files here, %{browseFiles} or import from:',
  dropPasteImportFolders: 'Drop files here, %{browseFolders} or import from:',
  editFile: 'Edit file',
  editFileWithFilename: 'Edit file %{file}',
  editImage: 'Edit image',
  editing: 'Editing %{file}',
  emptyFolderAdded: 'No files were added from empty folder',
  encoding: 'Encoding...',
  enterCorrectUrl:
    'Incorrect URL: Please make sure you are entering a direct link to a file',
  enterTextToSearch: 'Enter text to search for images',
  enterUrlToImport: 'Enter URL to import a file',
  error: 'Error',
  exceedsSize: '%{file} exceeds maximum allowed size of %{size}',
  failedToFetch:
    'Companion failed to fetch this URL, please make sure it’s correct',
  failedToUpload: 'Failed to upload %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} of %{smart_count} file uploaded',
    '1': '%{complete} of %{smart_count} files uploaded',
  },
  filter: 'Filter',
  finishEditingFile: 'Finish editing file',
  flipHorizontal: 'Flip horizontally',
  folderAdded: {
    '0': 'Added %{smart_count} file from %{folder}',
    '1': 'Added %{smart_count} files from %{folder}',
  },
  folderAlreadyAdded: 'The folder "%{folder}" was already added',
  generatingThumbnails: 'Generating thumbnails...',
  import: 'Import',
  importFiles: 'Import files from:',
  importFrom: 'Import from %{name}',
  inferiorSize: 'This file is smaller than the allowed size of %{size}',
  loadedXFiles: 'Loaded %{numFiles} files',
  loading: 'Loading...',
  logIn: 'Log in',
  logOut: 'Log out',
  micDisabled: 'Microphone access denied by user',
  missingRequiredMetaField: 'Missing required meta fields',
  missingRequiredMetaFieldOnFile: 'Missing required meta fields in %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Missing required meta field: %{fields}.',
    '1': 'Missing required meta fields: %{fields}.',
  },
  myDevice: 'My Device',
  noAudioDescription:
    'In order to record audio, please connect a microphone or another audio input device',
  noAudioTitle: 'Microphone Not Available',
  noCameraDescription:
    'In order to take pictures or record video, please connect a camera device',
  noCameraTitle: 'Camera Not Available',
  noDuplicates:
    "Cannot add the duplicate file '%{fileName}', it already exists",
  noFilesFound: 'You have no files or folders here',
  noInternetConnection: 'No Internet connection',
  noMoreFilesAllowed: 'Cannot add more files',
  noSearchResults: 'Unfortunately, there are no results for this search',
  openFolderNamed: 'Open folder %{name}',
  pause: 'Pause',
  paused: 'Paused',
  pauseUpload: 'Pause upload',
  pickFiles: 'Pick files',
  pickPhotos: 'Pick photos',
  pleaseWait: 'Please wait',
  pluginNameAudio: 'Audio',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Camera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameGoogleDrivePicker: 'Google Drive',
  pluginNameGooglePhotosPicker: 'Google Photos',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Screencast',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Link',
  pluginNameWebdav: 'WebDAV',
  pluginNameZoom: 'Zoom',
  pluginWebdavInputLabel:
    'WebDAV URL for a file (e.g. from ownCloud or Nextcloud)',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': 'Processing %{smart_count} file',
    '1': 'Processing %{smart_count} files',
  },
  recording: 'Recording',
  recordingLength: 'Recording length %{recording_length}',
  recordingStoppedMaxSize:
    'Recording stopped because the file size is about to exceed the limit',
  recordVideoBtn: 'Record Video',
  recoveredAllFiles: 'We restored all files. You can now resume the upload.',
  recoveredXFiles: {
    '0': 'We could not fully recover 1 file. Please re-select it and resume the upload.',
    '1': 'We could not fully recover %{smart_count} files. Please re-select them and resume the upload.',
  },
  removeFile: 'Remove file',
  reSelect: 'Re-select',
  resetFilter: 'Reset filter',
  resetSearch: 'Reset search',
  resume: 'Resume',
  resumeUpload: 'Resume upload',
  retry: 'Retry',
  retryUpload: 'Retry upload',
  revert: 'Reset',
  rotate: 'Rotate 90°',
  save: 'Save',
  saveChanges: 'Save changes',
  search: 'Search',
  searchImages: 'Search for images',
  selectX: {
    '0': 'Select %{smart_count}',
    '1': 'Select %{smart_count}',
  },
  sessionRestored: 'Session restored',
  showErrorDetails: 'Show error details',
  signInWithGoogle: 'Sign in with Google',
  smile: 'Smile!',
  startAudioRecording: 'Begin audio recording',
  startCapturing: 'Begin screen capturing',
  startRecording: 'Begin video recording',
  stopAudioRecording: 'Stop audio recording',
  stopCapturing: 'Stop screen capturing',
  stopRecording: 'Stop video recording',
  streamActive: 'Stream active',
  streamPassive: 'Stream passive',
  submitRecordedFile: 'Submit recorded file',
  takePicture: 'Take a picture',
  takePictureBtn: 'Take Picture',
  unnamed: 'Unnamed',
  upload: 'Upload',
  uploadComplete: 'Upload complete',
  uploadFailed: 'Upload failed',
  uploading: 'Uploading',
  uploadingXFiles: {
    '0': 'Uploading %{smart_count} file',
    '1': 'Uploading %{smart_count} files',
  },
  uploadPaused: 'Upload paused',
  uploadStalled:
    'Upload has not made any progress for %{seconds} seconds. You may want to retry it.',
  uploadXFiles: {
    '0': 'Upload %{smart_count} file',
    '1': 'Upload %{smart_count} files',
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} file',
    '1': 'Upload +%{smart_count} files',
  },
  xFilesSelected: {
    '0': '%{smart_count} file selected',
    '1': '%{smart_count} files selected',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} more file added',
    '1': '%{smart_count} more files added',
  },
  xTimeLeft: '%{time} left',
  youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
  youCanOnlyUploadX: {
    '0': 'You can only upload %{smart_count} file',
    '1': 'You can only upload %{smart_count} files',
  },
  youHaveToAtLeastSelectX: {
    '0': 'You have to select at least %{smart_count} file',
    '1': 'You have to select at least %{smart_count} files',
  },
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.en_US = en_US
}

export default en_US
