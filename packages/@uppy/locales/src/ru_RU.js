/* eslint camelcase: 0 */

const ru_RU = {}

ru_RU.strings = {
  addMoreFiles: 'Добавить дополнительные файлы',
  addingMoreFiles: 'Добавление дополнительных файлов',
  allowAccessDescription: 'Чтобы сделать фото или видео с помощью вашей камеры, пожалуйста разрешите доступ к камере для этого сайта',
  allowAccessTitle: 'Пожалуйста, разрешите доступ к камере',
  back: 'Назад',
  browse: 'выберите',
  cancel: 'Отмена',
  cancelUpload: 'Отменить загрузку',
  chooseFiles: 'Выбрать файлы',
  closeModal: 'Закрыть окно',
  companionAuthError: 'Требуется авторизация',
  companionError: 'Connection with Companion failed',
  complete: 'Готово',
  connectedToInternet: 'Подключено к интернету',
  copyLink: 'Скопировать ссылку',
  copyLinkToClipboardFallback: 'Copy the URL below',
  copyLinkToClipboardSuccess: 'Ссылка скопирована в буфер обмена',
  creatingAssembly: 'Preparing upload...',
  creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
  dashboardTitle: 'Uppy Dashboard',
  dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
  dataUploadedOfTotal: '%{complete} of %{total}',
  done: 'Готово',
  dropHereOr: 'Перетащите файлы сюда или %{browse}',
  dropPaste: 'Drop files here, paste or %{browse}',
  dropPasteImport: 'Перенесите файлы сюда, вставьте, %{browse} или импортируйте',
  edit: 'Редактировать',
  editFile: 'Редактировать файл',
  editing: 'Редактируется %{file}',
  emptyFolderAdded: 'No files were added from empty folder',
  encoding: 'Encoding...',
  enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file',
  enterUrlToImport: 'Введите адрес URL, чтобы импортировать файл',
  exceedsSize: 'This file exceeds maximum allowed size of',
  failedToFetch: 'Companion failed to fetch this URL, please make sure it’s correct',
  failedToUpload: 'Failed to upload %{file}',
  fileSource: 'File source: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} of %{smart_count} file uploaded',
    '1': '%{complete} of %{smart_count} files uploaded',
    '2': '%{complete} of %{smart_count} files uploaded'
  },
  filter: 'Фильтр',
  finishEditingFile: 'Finish editing file',
  folderAdded: {
    '0': 'Added %{smart_count} file from %{folder}',
    '1': 'Added %{smart_count} files from %{folder}',
    '2': 'Added %{smart_count} files from %{folder}'
  },
  import: 'Импортировать',
  importFrom: 'Импортировать из %{name}',
  link: 'Ссылка',
  logOut: 'Выйти',
  myDevice: 'Мое устройство',
  noFilesFound: 'You have no files or folders here',
  noInternetConnection: 'Нет подключения к интернету',
  pause: 'Поставить на паузу',
  pauseUpload: 'Pause upload',
  paused: 'На паузе',
  preparingUpload: 'Приготовление к загрузке...',
  processingXFiles: {
    '0': 'Processing %{smart_count} file',
    '1': 'Processing %{smart_count} files',
    '2': 'Processing %{smart_count} files'
  },
  removeFile: 'Remove file',
  resetFilter: 'Reset filter',
  resume: 'Resume',
  resumeUpload: 'Resume upload',
  retry: 'Retry',
  retryUpload: 'Retry upload',
  saveChanges: 'Сохранить изменения',
  selectXFiles: {
    '0': 'Select %{smart_count} file',
    '1': 'Select %{smart_count} files',
    '2': 'Select %{smart_count} files'
  },
  smile: 'Smile!',
  startRecording: 'Begin video recording',
  stopRecording: 'Stop video recording',
  takePicture: 'Take a picture',
  timedOut: 'Upload stalled for %{seconds} seconds, aborting.',
  upload: 'Upload',
  uploadComplete: 'Upload complete',
  uploadFailed: 'Upload failed',
  uploadPaused: 'Upload paused',
  uploadXFiles: {
    '0': 'Upload %{smart_count} file',
    '1': 'Upload %{smart_count} files',
    '2': 'Upload %{smart_count} files'
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} file',
    '1': 'Upload +%{smart_count} files',
    '2': 'Upload +%{smart_count} files'
  },
  uploading: 'Uploading',
  uploadingXFiles: {
    '0': 'Uploading %{smart_count} file',
    '1': 'Uploading %{smart_count} files',
    '2': 'Uploading %{smart_count} files'
  },
  xFilesSelected: {
    '0': '%{smart_count} file selected',
    '1': '%{smart_count} files selected',
    '2': '%{smart_count} files selected'
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} more file added',
    '1': '%{smart_count} more files added',
    '2': '%{smart_count} more files added'
  },
  xTimeLeft: '%{time} left',
  youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
  youCanOnlyUploadX: {
    '0': 'You can only upload %{smart_count} file',
    '1': 'You can only upload %{smart_count} files',
    '2': 'You can only upload %{smart_count} files'
  },
  youHaveToAtLeastSelectX: {
    '0': 'You have to select at least %{smart_count} file',
    '1': 'You have to select at least %{smart_count} files',
    '2': 'You have to select at least %{smart_count} files'
  }
}

ru_RU.pluralize = function (n) {
  if (n % 10 === 1 && n % 100 !== 11) {
    return 0
  }

  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    return 1
  }

  return 2
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.ru_RU = ru_RU
}

module.exports = ru_RU
