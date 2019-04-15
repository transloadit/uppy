/* eslint camelcase: 0 */

const en_US = {}

en_US.strings = {
  addMoreFiles: 'Add more files',
  addingMoreFiles: 'Adding more files',
  allowAccessDescription: 'In order to take pictures or record video with your camera, please allow camera access for this site.',
  allowAccessTitle: 'Please allow access to your camera',
  back: 'Back',
  browse: 'browse',
  cancel: 'Cancel',
  cancelUpload: 'Cancel upload',
  chooseFiles: 'Choose files',
  closeModal: 'Close Modal',
  companionAuthError: 'Authorization required',
  companionError: 'Connection with Companion failed',
  complete: 'Complete',
  connectedToInternet: 'Connected to the Internet',
  copyLink: 'Copy link',
  copyLinkToClipboardFallback: 'Copy the URL below',
  copyLinkToClipboardSuccess: 'Link copied to clipboard',
  creatingAssembly: 'Preparing upload...',
  creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
  dashboardTitle: 'Uppy Dashboard',
  dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
  dataUploadedOfTotal: '%{complete} of %{total}',
  done: 'Done',
  dropHereOr: 'Drop files here or %{browse}',
  dropPaste: 'Drop files here, paste or %{browse}',
  dropPasteImport: 'Drop files here, paste, %{browse} or import from',
  edit: 'Edit',
  editFile: 'Edit file',
  editing: 'Editing %{file}',
  emptyFolderAdded: 'No files were added from empty folder',
  encoding: 'Encoding...',
  enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file',
  enterUrlToImport: 'Enter URL to import a file',
  error: 'Error',
  exceedsSize: 'This file exceeds maximum allowed size of',
  failedToFetch: 'Companion failed to fetch this URL, please make sure it’s correct',
  failedToUpload: 'Failed to upload %{file}',
  fileProgress: 'File progress: upload speed and ETA',
  fileSource: 'File source: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} of %{smart_count} file uploaded',
    '1': '%{complete} of %{smart_count} files uploaded'
  },
  filter: 'Filter',
  finishEditingFile: 'Finish editing file',
  folderAdded: {
    '0': 'Added %{smart_count} file from %{folder}',
    '1': 'Added %{smart_count} files from %{folder}'
  },
  import: 'Import',
  importFrom: 'Import from %{name}',
  link: 'Link',
  localDisk: 'Local Disk',
  logOut: 'Log out',
  myDevice: 'My Device',
  name: 'Name',
  noFilesFound: 'You have no files or folders here',
  noInternetConnection: 'No Internet connection',
  numberOfSelectedFiles: 'Number of selected files',
  pause: 'Pause',
  pauseUpload: 'Pause upload',
  paused: 'Paused',
  pleasePressRetry: 'Please press Retry to upload again',
  preparingUpload: 'Preparing upload...',
  pressToRetry: 'Press to retry',
  processingXFiles: {
    '0': 'Processing %{smart_count} file',
    '1': 'Processing %{smart_count} files'
  },
  removeFile: 'Remove file',
  resetFilter: 'Reset filter',
  resume: 'Resume',
  resumeUpload: 'Resume upload',
  retry: 'Retry',
  retryUpload: 'Retry upload',
  saveChanges: 'Save changes',
  selectToUpload: 'Select files to upload',
  selectXFiles: {
    '0': 'Select %{smart_count} file',
    '1': 'Select %{smart_count} files'
  },
  smile: 'Smile!',
  startRecording: 'Begin video recording',
  stopRecording: 'Stop video recording',
  takePicture: 'Take a picture',
  timedOut: 'Upload stalled for %{seconds} seconds, aborting.',
  upload: 'Upload',
  uploadAllNewFiles: 'Upload all new files',
  uploadComplete: 'Upload complete',
  uploadFailed: 'Upload failed',
  uploadPaused: 'Upload paused',
  uploadXFiles: {
    '0': 'Upload %{smart_count} file',
    '1': 'Upload %{smart_count} files'
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} file',
    '1': 'Upload +%{smart_count} files'
  },
  uploading: 'Uploading',
  uploadingXFiles: {
    '0': 'Uploading %{smart_count} file',
    '1': 'Uploading %{smart_count} files'
  },
  xFilesSelected: {
    '0': '%{smart_count} file selected',
    '1': '%{smart_count} files selected'
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} more file added',
    '1': '%{smart_count} more files added'
  },
  xTimeLeft: '%{time} left',
  youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
  youCanOnlyUploadX: {
    '0': 'You can only upload %{smart_count} file',
    '1': 'You can only upload %{smart_count} files'
  },
  youHaveToAtLeastSelectX: {
    '0': 'You have to select at least %{smart_count} file',
    '1': 'You have to select at least %{smart_count} files'
  }
}

en_US.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.en_US = en_US
}

module.exports = en_US
