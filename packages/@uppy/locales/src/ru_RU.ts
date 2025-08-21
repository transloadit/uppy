import type { Locale } from '@uppy/utils'

const ru_RU: Locale<0 | 1 | 2> = {
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

ru_RU.strings = {
  addBulkFilesFailed: {
    '0': 'Не удалось добавить %{smart_count} файл из-за внутренней ошибки',
    '1': 'Не удалось добавить %{smart_count} файла из-за внутренней ошибки',
    '2': 'Не удалось добавить %{smart_count} файлов из-за внутренней ошибки',
  },
  addedNumFiles: {
    '0': 'Добавлен %{numFiles} файл',
    '1': 'Добавлено %{numFiles} файла',
    '2': 'Добавлено %{numFiles} файлов',
  },
  addingMoreFiles: 'Добавление дополнительных файлов',
  additionalRestrictionsFailed: {
    '0': '%{count} дополнительное ограничение не было удовлетворено',
    '1': '%{count} дополнительных ограничения не были удовлетворены',
    '2': '%{count} дополнительных ограничений не были удовлетворены',
  },
  addMore: 'Добавить еще',
  addMoreFiles: 'Добавить еще файлы',
  allFilesFromFolderNamed: 'Все файлы из папки %{name}',
  allowAccessDescription:
    'Чтобы сделать фото или записать видео, пожалуйста, разрешите доступ к камере для этого сайта',
  allowAccessTitle: 'Пожалуйста, разрешите доступ к вашей камере',
  allowAudioAccessDescription:
    'Чтобы записать аудио, пожалуйста, разрешите доступ к микрофону для этого сайта',
  allowAudioAccessTitle: 'Пожалуйста, разрешите доступ к вашему микрофону',
  aspectRatioLandscape: 'Обрезать альбомный формат (16:9)',
  aspectRatioPortrait: 'Обрезать портрет (9:16)',
  aspectRatioSquare: 'Обрезать квадрат',
  authAborted: 'Аутентификация прервана',
  authenticateWith: 'Подключиться к %{pluginName}',
  authenticateWithTitle:
    'Пожалуйста, авторизуйтесь в %{pluginName}, чтобы выбрать файлы',
  back: 'Назад',
  browse: 'выберите',
  browseFiles: 'выберите файлы',
  cancel: 'Отменить',
  cancelUpload: 'Отменить загрузку',
  closeModal: 'Закрыть окно',
  companionError: 'Не удалось подключиться к Companion',
  companionUnauthorizeHint:
    'Чтобы выйти из вашего аккаунта %{provider}, пожалуйста, перейдите по ссылке %{url}',
  // «Готово» вместо «загрузка завершена», потому что кроме загрузки бывает encoding — транскодирование файлов
  complete: 'Готово',
  compressedX: 'Сохранено %{size} благодаря сжатию изображений',
  compressingImages: 'Сжатие изображений...',
  // «Нет подключения к интернету» — «Подключено к интернету»
  connectedToInternet: 'Подключено к интернету',
  copyLink: 'Скопировать ссылку',
  copyLinkToClipboardFallback: 'Скопируйте ссылку',
  copyLinkToClipboardSuccess: 'Ссылка скопирована в буфер обмена',
  creatingAssembly: 'Подготовка загрузки...',
  creatingAssemblyFailed: 'Transloadit: не удалось создать Assembly',
  dashboardTitle: 'Загрузчик файлов',
  dashboardWindowTitle:
    'Окно загрузчика файлов (нажмите escape, чтобы закрыть)',
  dataUploadedOfTotal: '%{complete} из %{total}',
  discardRecordedFile: 'Удалить записанный файл',
  done: 'Готово',
  dropHint: 'Перетащите файлы сюда',
  dropPasteBoth: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteFiles: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteFolders: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteImportBoth:
    'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  dropPasteImportFiles:
    'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  dropPasteImportFolders:
    'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  editFile: 'Редактировать файл',
  editImage: 'Редактировать изображение',
  editFileWithFilename: 'Редактировать файл %{file}',
  editing: 'Редактируется %{file}',
  emptyFolderAdded: 'Файлы не были добавлены — папка пуста',
  encoding: 'Обработка...',
  enterCorrectUrl:
    'Неправильный адрес: пожалуйста, убедитесь что вы используете прямую ссылку на файл',
  enterTextToSearch: 'Введите текст для поиска изображений',
  enterUrlToImport: 'Введите адрес, чтобы импортировать файл',
  error: 'Ошибка',
  exceedsSize: 'Этот файл больше максимально разрешенного размера в %{size}',
  failedToFetch:
    'Companion не смог загрузить файл по ссылке, пожалуйста, убедитесь, что адрес верный',
  failedToUpload: 'Ошибка загрузки %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} из %{smart_count} файла загружено',
    '1': '%{complete} из %{smart_count} файлов загружено',
    '2': '%{complete} из %{smart_count} файлов загружено',
  },
  filter: 'Фильтр',
  finishEditingFile: 'Закончить редактирование файла',
  flipHorizontal: 'Повернуть горизонтально',
  folderAdded: {
    '0': 'Добавлен %{smart_count} файл из %{folder}',
    '1': 'Добавлено %{smart_count} файла из %{folder}',
    '2': 'Добавлено %{smart_count} файлов из %{folder}',
  },
  folderAlreadyAdded: 'Папка "%{folder}" уже была добавлена',
  generatingThumbnails: 'Создание превью изображений...',
  import: 'Импортировать',
  importFiles: 'Импортировать файлы из:',
  importFrom: 'Импортировать из %{name}',
  inferiorSize: 'Этот файл меньше минимального размера %{size}',
  loadedXFiles: {
    '0': 'Загружен %{numFiles} файл',
    '1': 'Загружено %{numFiles} файла',
    '2': 'Загружено %{numFiles} файлов',
  },
  loading: 'Загрузка...',
  logOut: 'Выйти',
  micDisabled: 'Пользователь ограничил доступ к микрофону',
  missingRequiredMetaField: 'Отсутствуют обязательные meta поля',
  missingRequiredMetaFieldOnFile:
    'В файле %{fileName} отсутствуют обязательные meta поля',
  missingRequiredMetaFields: {
    '0': 'Отсутствует обязательное meta поле: %{fields}.',
    '1': 'Отсутствуют обязательные meta поля: %{fields}.',
    '2': 'Отсутствуют обязательные meta поля: %{fields}.',
  },
  myDevice: 'Мое устройство',
  noAudioDescription:
    'Пожалуйста, подключите микрофон или другое аудиоустройство, чтобы записывать аудио',
  noAudioTitle: 'Микрофон недоступен',
  noCameraDescription:
    'Пожалуйста, подключите камеру, чтобы сделать фото или записать видео',
  noCameraTitle: 'Камера недоступна',
  noDuplicates: "Нельзя добавить '%{fileName}', файл уже добавлен",
  noFilesFound: 'Здесь нет файлов или папок',
  noInternetConnection: 'Нет подключения к интернету',
  noMoreFilesAllowed: 'Нельзя добавить больше файлов',
  noSearchResults: 'К сожалению, нет результатов для поискового запроса',
  openFolderNamed: 'Открыть папку %{name}',
  pause: 'Поставить на паузу',
  paused: 'На паузе',
  pauseUpload: 'Поставить загрузку на паузу',
  poweredBy: 'Работает на %{uppy}',
  processingXFiles: {
    '0': 'Обрабатывается %{smart_count} файл',
    '1': 'Обрабатываются %{smart_count} файла',
    '2': 'Обрабатываются %{smart_count} файлов',
  },
  recording: 'Идет запись',
  recordingLength: 'Длительность записи %{recording_length}',
  recordingStoppedMaxSize:
    'Запись остановлена из-за того, что файл достиг максимального размера',
  recordVideoBtn: 'Записать видео',
  recoveredAllFiles: 'Все файлы восстановлены. Вы можете продолжить загрузку.',
  recoveredXFiles: {
    '0': 'Не удалось восстановить %{smart_count} файл. Пожалуйста, выберите его заново и продолжите загрузку.',
    '1': 'Не удалось восстановить %{smart_count} файла. Пожалуйста, выберите их заново и продолжите загрузку.',
    '2': 'Не удалось восстановить %{smart_count} файлов. Пожалуйста, выберите их заново и продолжите загрузку.',
  },
  removeFile: 'Удалить файл',
  reSelect: 'Выбрать заново',
  resetFilter: 'Сбросить фильтр',
  resetSearch: 'Сбросить поиск',
  resume: 'Продолжить',
  resumeUpload: 'Продолжить загрузку',
  retry: 'Повторить попытку',
  retryUpload: 'Повторить попытку загрузки',
  revert: 'Отменить изменения',
  rotate: 'Повернуть',
  save: 'Сохранить',
  saveChanges: 'Сохранить изменения',
  search: 'Поиск',
  searchImages: 'Поиск изображений',
  selectX: {
    '0': 'Выбрать %{smart_count}',
    '1': 'Выбрать %{smart_count}',
    '2': 'Выбрать %{smart_count}',
  },
  sessionRestored: 'Сессия восстановлена',
  showErrorDetails: 'Показать детали ошибки',
  signInWithGoogle: 'Войти с Google',
  smile: 'Улыбнитесь!',
  startAudioRecording: 'Начать запись аудио',
  startCapturing: 'Начать запись экрана',
  startRecording: 'Начать запись видео',
  stopAudioRecording: 'Остановить запись аудио',
  stopCapturing: 'Остановить запись экрана',
  stopRecording: 'Закончить запись видео',
  streamActive: 'Активный поток',
  streamPassive: 'Пассивный поток',
  submitRecordedFile: 'Отправить записанный файл',
  takePicture: 'Сделать фотографию',
  takePictureBtn: 'Сделать фотографию',
  timedOut: 'Загрузка остановилась на %{seconds} секунд, отмена',
  upload: 'Загрузить',
  uploadComplete: 'Загрузка завершена',
  uploadFailed: 'Загрузка не удалась',
  uploadPaused: 'Загрузка на паузе',
  uploadStalled: {
    '0': 'Прошла %{seconds} секунда без прогресса в загрузке. Возможно, вы хотите перезапустить ее.',
    '1': 'Прошло %{seconds} секунды без прогресса в загрузке. Возможно, вы хотите перезапустить ее.',
    '2': 'Прошло %{seconds} секунд без прогресса в загрузке. Возможно, вы хотите перезапустить ее.',
  },
  uploadXFiles: {
    '0': 'Загрузить %{smart_count} файл',
    '1': 'Загрузить %{smart_count} файла',
    '2': 'Загрузить %{smart_count} файлов',
  },
  uploadXNewFiles: {
    '0': 'Загрузить +%{smart_count} файл',
    '1': 'Загрузить +%{smart_count} файла',
    '2': 'Загрузить +%{smart_count} файлов',
  },
  uploading: 'Загрузка',
  uploadingXFiles: {
    '0': 'Загружается %{smart_count} файл',
    '1': 'Загружается %{smart_count} файла',
    '2': 'Загружается %{smart_count} файлов',
  },
  xFilesSelected: {
    '0': '%{smart_count} файл выбран',
    '1': '%{smart_count} файла выбрано',
    '2': '%{smart_count} файлов выбрано',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} дополнительный файл добавлен',
    '1': '%{smart_count} дополнительных файла добавлено',
    '2': '%{smart_count} дополнительных файлов добавлено',
  },
  xTimeLeft: 'осталось %{time}',
  youCanOnlyUploadFileTypes: 'Вы можете загрузить только: %{types}',
  youCanOnlyUploadX: {
    '0': 'Вы можете загрузить только %{smart_count} файл',
    '1': 'Вы можете загрузить только %{smart_count} файла',
    '2': 'Вы можете загрузить только %{smart_count} файлов',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Вы должны выбрать хотя бы %{smart_count} файл',
    '1': 'Вы должны выбрать хотя бы %{smart_count} файла',
    '2': 'Вы должны выбрать хотя бы %{smart_count} файлов',
  },
  zoomIn: 'Приблизить',
  zoomOut: 'Отдалить',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ru_RU = ru_RU
}

export default ru_RU
