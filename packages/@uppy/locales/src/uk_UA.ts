import type { Locale } from '@uppy/utils'

const uk_UA: Locale<0 | 1 | 2> = {
  strings: {},
  pluralize(n) {
    if (n % 10 === 1 && n % 100 !== 11) {
      return 0
    }

    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
      return 1
    }

    return 2
  },
}

uk_UA.strings = {
  addBulkFilesFailed: {
    '0': 'Не вдалося додати файл %{smart_count} через внутрішню помилку',
    '1': 'Не вдалося додати %{smart_count} файли через внутрішні помилки',
    '2': 'Не вдалося додати %{smart_count} файлів через внутрішні помилки',
  },
  addingMoreFiles: 'Додавання додаткових файлів',
  addMore: 'Додати ще',
  addMoreFiles: 'Додати ще файли',
  allFilesFromFolderNamed: 'Всі файли з папки %{name}',
  allowAccessDescription:
    'Щоб зробити фото або відео, будь ласка, дозвольте доступ до камери для цього сайту',
  allowAccessTitle: 'Будь ласка, дозвольте доступ до вашої камери',
  allowAudioAccessDescription:
    'Для запису звуку, будь ласка, надайте доступ до мікрофону для цього сайту.',
  allowAudioAccessTitle: 'Дозвольте доступ до мікрофону',
  aspectRatioLandscape: 'Обрізати альбомний режим (16:9)',
  aspectRatioPortrait: 'Обрізати портрет (9:16)',
  aspectRatioSquare: 'Обрізати квадрат',
  authAborted: 'Автентифікація перервана',
  authenticateWith: "Під'єднатися до %{pluginName}",
  authenticateWithTitle:
    'Будь ласка, авторизуйтесь у %{pluginName}, щоб обрати файли',
  back: 'Назад',
  browse: 'оберіть',
  browseFiles: 'оберіть',
  browseFolders: 'огляд тек',
  cancel: 'Скасувати',
  cancelUpload: 'Скасувати завантаження',
  closeModal: 'Закрити вікно',
  companionError: "Не вдалося під'єднатися до Companion",
  companionUnauthorizeHint:
    'Щоб скасувати авторизацію вашого облікового запису %{provider}, перейдіть на %{url}',
  complete: 'Готово',
  compressedX: 'Збережено %{size} шляхом стискання зображень',
  compressingImages: 'Стиснення зображень...',
  connectedToInternet: "Під'єднано до інтернету",
  copyLink: 'Копіювати посилання',
  copyLinkToClipboardFallback: 'Скопіюйте посилання',
  copyLinkToClipboardSuccess: 'Посилання скопійована в буфер обміну',
  creatingAssembly: 'Підготовка до завантаження...',
  creatingAssemblyFailed: 'Transloadit: не вдалося згенерувати Assembly',
  dashboardTitle: 'Завантажувач файлів',
  dashboardWindowTitle:
    'Вікно завантажувача файлів (натисніть escape, щоб закрити)',
  dataUploadedOfTotal: '%{complete} із %{total}',
  discardRecordedFile: 'Відкинути записаний файл',
  done: 'Готово',
  dropHint: 'Перетягніть файли сюди',
  dropPasteBoth: 'Перетягніть файли, вставте або %{browse}',
  dropPasteFiles: 'Перетягніть файли, вставте або %{browse}',
  dropPasteFolders: 'Перетягніть файли, вставте або %{browse}',
  dropPasteImportBoth:
    'Перетягніть файли, вставте, %{browse} або імпортуйте з:',
  dropPasteImportFiles:
    'Перетягніть файли, вставте, %{browse} або імпортуйте з:',
  dropPasteImportFolders:
    'Перетягніть файли, вставте, %{browse} або імпортуйте з:',
  editFile: 'Редагувати файл',
  editImage: 'Редагувати зображення',
  editFileWithFilename: 'Редагувати файл %{file}',
  editing: 'Редагується %{file}',
  emptyFolderAdded: 'Файли не додано — тека порожня',
  encoding: 'Обробка...',
  enterCorrectUrl:
    'Невірна адреса: будь ласка, переконайтеся що ви використовуєте пряме посилання на файл',
  enterTextToSearch: 'Введіть текст для пошуку зображень',
  enterUrlToImport: 'Введіть адресу, щоб імпортувати файл',
  exceedsSize: 'Цей файл більше максимально дозволеного розміру в %{size}',
  failedToFetch:
    'Companion не зміг завантажити файл за посиланням, будь ласка, переконайтеся, що адреса вірна',
  failedToUpload: 'Помилка завантаження %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} із %{smart_count} файл завантажено',
    '1': '%{complete} із %{smart_count} файлів завантажено',
    '2': '%{complete} із %{smart_count} файлів завантажено',
  },
  filter: 'Фільтр',
  finishEditingFile: 'Завершити редагування файлу',
  flipHorizontal: 'Віддзеркалити горизонтально',
  folderAdded: {
    '0': 'Додано %{smart_count} файл із %{folder}',
    '1': 'Додано %{smart_count} файли із %{folder}',
    '2': 'Додано %{smart_count} файлів із %{folder}',
  },
  folderAlreadyAdded: 'Папка "%{folder}" вже додана',
  generatingThumbnails: 'Створення мініатюр...',
  import: 'Імпортувати',
  importFiles: 'Імпортувати файли з:',
  importFrom: 'Імпортувати з %{name}',
  inferiorSize: 'Цей файл менший за дозволений розмір %{size}',
  loading: 'Завантаження...',
  logOut: 'Вийти',
  micDisabled: 'Доступ до мікрофона заборонений користувачем',
  missingRequiredMetaField: "Відсутні обов'язкові поля meta",
  missingRequiredMetaFieldOnFile:
    "У %{fileName} відсутні обов'язкові поля meta",
  missingRequiredMetaFields: {
    '0': "Відсутнє обов'язкове поле meta: %{fields}.",
    '1': "Відсутні обов'язкові поля meta: %{fields}.",
    '2': "Відсутні обов'язкові поля meta: %{fields}.",
  },
  myDevice: 'Мій пристрій',
  noAudioDescription:
    'Для запису аудіо, підключіть мікрофон або інший пристрій введення звуку',
  noAudioTitle: 'Мікрофон недоступний',
  noCameraDescription:
    'Для того, щоб робити зображення чи запис відео, будь ласка, підключіть пристрій камери',
  noCameraTitle: 'Камера недоступна',
  noDuplicates: "Не вдається додати дублікат файлу '%{fileName}, він уже існує",
  noFilesFound: 'Тут відсутні файли або теки',
  noInternetConnection: 'Відсутнє підключення до мережі Інтернет',
  noMoreFilesAllowed: 'Не вдалося додати більше файлів',
  openFolderNamed: 'Відкрити теку %{name}',
  pause: 'Поставити на паузу',
  paused: 'На паузі',
  pauseUpload: 'Поставити завантаження на паузу',
  pluginNameAudio: 'Звук',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Камера',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Працює на %{uppy}',
  processingXFiles: {
    '0': 'Обробляється %{smart_count} файл',
    '1': 'Обробляється %{smart_count} файли',
    '2': 'Обробляється %{smart_count} файлів',
  },
  recording: 'Запис',
  recordingLength: 'Тривалість запису %{recording_length}',
  recordingStoppedMaxSize:
    'Запис зупинено, оскільки розмір файлу перевищить ліміт',
  recordVideoBtn: 'Записати Відео',
  recoveredAllFiles:
    'Ми відновили всі файли. Ви можете продовжити завантаження.',
  recoveredXFiles: {
    '0': 'Ми не змогли повністю відновити 1 файл. Будь ласка, повторно виберіть його і відновіть завантаження.',
    '1': 'Ми не змогли повністю відновити %{smart_count} файли. Будь ласка, повторно виберіть їх і відновіть завантаження.',
    '2': 'Ми не змогли повністю відновити %{smart_count} файлів. Будь ласка, повторно виберіть їх і відновіть завантаження.',
  },
  removeFile: 'Знищити файл',
  reSelect: 'Обрати повторно',
  resetFilter: 'Скинути фільтр',
  resume: 'Продовжити',
  resumeUpload: 'Продовжити завантаження',
  retry: 'Спробувати знову',
  retryUpload: 'Повторити спробу завантаження',
  revert: 'Скасувати зміни',
  rotate: 'Повернути',
  save: 'Зберегти',
  saveChanges: 'Зберегти зміни',
  search: 'Пошук',
  searchImages: 'Пошук зображень',
  selectX: {
    '0': 'Обрати %{smart_count}',
    '1': 'Обрати %{smart_count}',
    '2': 'Обрати %{smart_count}',
  },
  sessionRestored: 'Сеанс відновлено',
  showErrorDetails: 'Показати деталі помилки',
  signInWithGoogle: 'Увійти за допомогою Google',
  smile: 'Посміхніться!',
  startAudioRecording: 'Почати запис аудіо',
  startCapturing: 'Почати захоплення екрана',
  startRecording: 'Почати запис відео',
  stopAudioRecording: 'Зупинити запис аудіо',
  stopCapturing: 'Зупинити захоплення екрана',
  stopRecording: 'Закінчити запис відео',
  streamActive: 'Потік активний',
  streamPassive: 'Потік пасивний',
  submitRecordedFile: 'Надіслати записаний файл',
  takePicture: 'Зробити фотографію',
  takePictureBtn: 'Зробити знімок',
  timedOut: 'Завантаження зупинилося на %{seconds} сек., скасування',
  upload: 'Завантажити',
  uploadComplete: 'Завантаження завершено',
  uploadFailed: 'Завантаження не вдале',
  uploading: 'Завантаження',
  uploadingXFiles: {
    '0': 'Завантажується %{smart_count} файл',
    '1': 'Завантажується %{smart_count} файли',
    '2': 'Завантажується %{smart_count} файлів',
  },
  uploadPaused: 'Завантаження на паузі',
  uploadXFiles: {
    '0': 'Завантажити %{smart_count} файл',
    '1': 'Завантажити %{smart_count} файли',
    '2': 'Завантажити %{smart_count} файлів',
  },
  uploadXNewFiles: {
    '0': 'Завантажити +%{smart_count} файл',
    '1': 'Завантажити +%{smart_count} файли',
    '2': 'Завантажити +%{smart_count} файлів',
  },
  xFilesSelected: {
    '0': '%{smart_count} файл обрано',
    '1': '%{smart_count} файли обрано',
    '2': '%{smart_count} файлів обрано',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} додатковий файл додано',
    '1': '%{smart_count} додаткові файли додано',
    '2': '%{smart_count} додаткових файлів додано',
  },
  xTimeLeft: 'залишилося %{time}',
  youCanOnlyUploadFileTypes: 'Ви можете завантажити тільки: %{types}',
  youCanOnlyUploadX: {
    '0': 'Ви можете завантажити тільки %{smart_count} файл',
    '1': 'Ви можете завантажити тільки %{smart_count} файли',
    '2': 'Ви можете завантажити тільки %{smart_count} файлів',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Ви повинні обрати хоча б %{smart_count} файл',
    '1': 'Ви повинні обрати хоча б %{smart_count} файли',
    '2': 'Ви повинні обрати хоча б %{smart_count} файлів',
  },
  zoomIn: 'Збільшити',
  zoomOut: 'Зменшити',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.uk_UA = uk_UA
}

export default uk_UA
