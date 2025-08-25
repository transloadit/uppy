import type { Locale } from '@uppy/utils'

const bg_BG: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

bg_BG.strings = {
  addBulkFilesFailed: {
    '0': 'Файлът %{smart_count} не може да бъде добавен поради вътрешна грешка',
    '1': 'Не могат да се добавят %{smart_count} файла поради вътрешни грешки',
  },
  addMore: 'Добави повече',
  addMoreFiles: 'Добави повече файлове',
  addingMoreFiles: 'Добавяне на повече файлове',
  allowAccessDescription:
    'За да правите изображения или запишете видео с камерата моля, разшерете достъп до камерата за този сайт',
  allowAccessTitle: 'Моля, разрешете достъп до камерата',
  authenticateWith: 'Свържете се с %{pluginName}',
  authenticateWithTitle:
    'Моля, впишете се с %{pluginName}, за да изберете файлове',
  back: 'Назад',
  browse: 'преглед',
  browseFiles: 'преглед',
  cancel: 'Отказ',
  cancelUpload: 'Отказване на качването',
  closeModal: 'Затваряне на прозорец',
  companionError: 'Неуспешна връзка с Companion',
  companionUnauthorizeHint:
    'За да се отпишете от акаута си в %{provider} посетете %{url}',
  complete: 'Завършен',
  connectedToInternet: 'Свързан с интернет',
  copyLink: 'Копиране на линк',
  copyLinkToClipboardFallback: 'Копиране на долния линк',
  copyLinkToClipboardSuccess: 'Линкът е копиран',
  creatingAssembly: 'Подготовка за качване...',
  creatingAssemblyFailed: 'Transloadit: библиотеката не може да се създаде',
  dashboardTitle: 'Качване на файлове',
  dashboardWindowTitle:
    'Прозорец за качване на файлове (Натиснете ESC за затваряне)',
  dataUploadedOfTotal: '%{complete} от %{total}',
  done: 'Готово',
  dropHint: 'Пуснете файловете си тук',
  dropPasteBoth: 'Пуснете файловете си тук, поставете или %{browse}',
  dropPasteFiles: 'Пуснете файловете си тук, поставете или %{browse}',
  dropPasteFolders: 'Пуснете файловете си тук, поставете или %{browse}',
  dropPasteImportBoth:
    'Пуснете файловете си тук, поставете, %{browse} или импортирайте от:',
  dropPasteImportFiles:
    'Пуснете файловете си тук, поставете, %{browse} или импортирайте от:',
  dropPasteImportFolders:
    'Пуснете файловете си тук, поставете, %{browse} или импортирайте от:',
  editFile: 'Редакция файл',
  editImage: 'Редактиране на изображение',
  editing: 'Редактиране %{file}',
  emptyFolderAdded: 'Не са добавени файлове от празна директория',
  encoding: 'Кодиране...',
  enterCorrectUrl:
    'Неправилен адрес: Моля, уверете се, че въвеждате директна връзка към файл',
  enterUrlToImport: 'Въведете адрес за да импортиране файл',
  exceedsSize:
    'Размерът на файла надвишава максимално разрешения размер от %{size}',
  failedToFetch:
    'Companion не успя да достъпи този адрес, уверете се че е правилен',
  failedToUpload: 'Грешка при качване на %{file}',
  fileSource: 'Име на сорс файл: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} от %{smart_count} файл качен',
    '1': '%{complete} от %{smart_count} файлове качени',
  },
  filter: 'Филтър',
  finishEditingFile: 'Край на редакцията на файла',
  folderAdded: {
    '0': 'Добавен %{smart_count} файл от %{folder}',
    '1': 'Добавени %{smart_count} файлове от %{folder}',
  },
  generatingThumbnails: 'Генериране на миниатюри...',
  import: 'Импортиране',
  importFrom: 'Импортиране от %{name}',
  loading: 'Зареждане...',
  logOut: 'Изход',
  micDisabled: 'Достъп до микрофонът е отказан от потребителя',
  myDevice: 'Моето устройство',
  noDuplicates:
    "Файлът '%{fileName}' съществува. Не може да добавите дублиращи файлове",
  noFilesFound: 'Тук нямате файлове или директории',
  noInternetConnection: 'Няма връзка с интернет',
  noMoreFilesAllowed: 'Не може да се добавят нови файлове: в процес на качване',
  openFolderNamed: 'Отваряне на директория %{name}',
  pause: 'Пауза',
  pauseUpload: 'Паузиране на качването',
  paused: 'Паузиран',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': 'Обработване %{smart_count} файл',
    '1': 'Обработване %{smart_count} файлове',
  },
  recording: 'Записване',
  recordingLength: 'Дължина на записа %{recording_length}',
  recordingStoppedMaxSize:
    'Записът е прекъснат, защото размерът на файла наближава максимално допустимия размер',
  removeFile: 'Премахване на файл',
  resetFilter: 'Изчистване на филтър',
  resume: 'Възстановяване',
  resumeUpload: 'Възстановяване на качването',
  retry: 'Нов опит',
  retryUpload: 'Нов опит за качване',
  saveChanges: 'Запис на промените',
  selectFileNamed: 'Изберете файл %{name}',
  selectX: {
    '0': 'Избран %{smart_count}',
    '1': 'Избрани %{smart_count}',
  },
  smile: 'Усмивка! ;)',
  startCapturing: 'Започване запис на екрана',
  startRecording: 'Започване запис на видео',
  stopCapturing: 'Спиране на запис на екрана',
  stopRecording: 'Спиране на видео запис',
  streamActive: 'Активен стрийм',
  streamPassive: 'Пасивен стрийм',
  submitRecordedFile: 'Подаване на записаното видео',
  takePicture: 'Направа на снимка',
  timedOut: 'Качването е в застой за %{seconds} секунди, прекъсване.',
  unselectFileNamed: 'Размаркиране файл %{name}',
  upload: 'Качване',
  uploadComplete: 'Качването е успешно',
  uploadFailed: 'Качването неуспешно',
  uploadPaused: 'Качването е паузирано',
  uploadXFiles: {
    '0': 'Качване %{smart_count} файл',
    '1': 'качване %{smart_count} файлове',
  },
  uploadXNewFiles: {
    '0': 'Качване +%{smart_count} файл',
    '1': 'Качване +%{smart_count} файлове',
  },
  uploading: 'Качване',
  uploadingXFiles: {
    '0': 'Качване %{smart_count} файл',
    '1': 'Качване %{smart_count} файлове',
  },
  xFilesSelected: {
    '0': '%{smart_count} файл е избран',
    '1': '%{smart_count} файлове са избрани',
  },
  xMoreFilesAdded: {
    '0': 'Още %{smart_count} файл е добавен',
    '1': 'Оше %{smart_count} файла са добавени',
  },
  xTimeLeft: 'Остават %{time}',
  youCanOnlyUploadFileTypes: 'Можете да качване само файлове: %{types}',
  youCanOnlyUploadX: {
    '0': 'Може да качвате само %{smart_count} файл',
    '1': 'Може да качвате само %{smart_count} файлове',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Трябва да изберете поне %{smart_count} файл',
    '1': 'Трябва да изберете поне %{smart_count} файла',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.bg_BG = bg_BG
}

export default bg_BG
