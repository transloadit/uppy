const ru_RU = {
  pluralize (n) {
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
  addMoreFiles: 'Добавить еще файлы',
  addingMoreFiles: 'Добавление дополнительных файлов',
  allowAccessDescription: 'Чтобы сделать фото или видео, пожалуйста, разрешите доступ к камере для этого сайта',
  allowAccessTitle: 'Пожалуйста, разрешите доступ к вашей камере',
  authenticateWithTitle: 'Пожалуйста, авторизуйтесь в %{pluginName}, чтобы выбрать файлы',
  authenticateWith: 'Подключиться к %{pluginName}',
  back: 'Назад',
  addMore: 'Добавить еще',
  browse: 'выберите',
  browseFiles: 'выберите',
  cancel: 'Отменить',
  cancelUpload: 'Отменить загрузку',
  chooseFiles: 'Выбрать файлы',
  closeModal: 'Закрыть окно',
  companionError: 'Не удалось подключиться к Companion',
  // «Готово» вместо «загрузка завершена», потому что кроме загрузки бывает encoding — транскодирование файлов
  complete: 'Готово',
  // «Нет подключения к интернету» — «Подключено к интернету»
  connectedToInternet: 'Подключено к интернету',
  copyLink: 'Скопировать ссылку',
  copyLinkToClipboardFallback: 'Скопируйте ссылку',
  copyLinkToClipboardSuccess: 'Ссылка скопирована в буфер обмена',
  creatingAssembly: 'Подготовка загрузки...',
  creatingAssemblyFailed: 'Transloadit: не удалось создать Assembly',
  dashboardTitle: 'Загрузчик файлов',
  dashboardWindowTitle: 'Окно загрузчика файлов (нажмите escape, чтобы закрыть)',
  dataUploadedOfTotal: '%{complete} из %{total}',
  done: 'Готово',
  dropHereOr: 'Перетащите файлы или %{browse}',
  dropHint: 'Перетащите файлы сюда',
  dropPasteBoth: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteFiles: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteFolders: 'Перетащите файлы, вставьте или %{browse}',
  dropPasteImportBoth: 'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  dropPasteImportFiles: 'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  dropPasteImportFolders: 'Перетащите файлы, вставьте, %{browse} или импортируйте из:',
  editFile: 'Редактировать файл',
  editing: 'Редактируется %{file}',
  emptyFolderAdded: 'Файлы не были добавлены — папка пуста',
  encoding: 'Обработка...',
  enterCorrectUrl: 'Неправильный адрес: пожалуйста, убедитесь что вы используете прямую ссылку на файл',
  enterUrlToImport: 'Введите адрес, чтобы импортировать файл',
  exceedsSize: 'Этот файл больше максимально разрешенного размера в %{size}',
  failedToFetch: 'Companion не смог загрузить файл по ссылке, пожалуйста, убедитесь, что адрес верный',
  failedToUpload: 'Ошибка загрузки %{file}',
  fileSource: 'Источник файла: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} из %{smart_count} файла загружено',
    '1': '%{complete} из %{smart_count} файлов загружено',
    '2': '%{complete} из %{smart_count} файлов загружено',
  },
  filter: 'Фильтр',
  finishEditingFile: 'Закончить редактирование файла',
  folderAdded: {
    '0': 'Добавлен %{smart_count} файл из %{folder}',
    '1': 'Добавлено %{smart_count} файла из %{folder}',
    '2': 'Добавлено %{smart_count} файлов из %{folder}',
  },
  import: 'Импортировать',
  importFrom: 'Импортировать из %{name}',
  loading: 'Загрузка...',
  logOut: 'Выйти',
  myDevice: 'Мое устройство',
  noFilesFound: 'Здесь нет файлов или папок',
  noInternetConnection: 'Нет подключения к интернету',
  pause: 'Поставить на паузу',
  pauseUpload: 'Поставить загрузку на паузу',
  paused: 'На паузе',
  processingXFiles: {
    '0': 'Обрабатывается %{smart_count} файл',
    '1': 'Обрабатываются %{smart_count} файла',
    '2': 'Обрабатываются %{smart_count} файлов',
  },
  poweredBy: 'Работает на %{uppy}',
  removeFile: 'Удалить файл',
  resetFilter: 'Сбросить фильтр',
  resume: 'Продолжить',
  resumeUpload: 'Продолжить загрузку',
  retry: 'Повторить попытку',
  retryUpload: 'Повторить попытку загрузки',
  save: 'Сохранить',
  saveChanges: 'Сохранить',
  selectX: {
    '0': 'Выбрать %{smart_count}',
    '1': 'Выбрать %{smart_count}',
    '2': 'Выбрать %{smart_count}',
  },
  smile: 'Улыбнитесь!',
  startRecording: 'Начать запись видео',
  stopRecording: 'Закончить запись видео',
  takePicture: 'Сделать фотографию',
  timedOut: 'Загрузка остановилась на %{seconds} секунд, отмена',
  upload: 'Загрузить',
  uploadComplete: 'Загрузка завершена',
  uploadFailed: 'Загрузка не удалась',
  uploadPaused: 'Загрузка на паузе',
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
  selectFileNamed: 'Выбрать файл %{name}',
  unselectFileNamed: 'Отменить выбор файла %{name}',
  openFolderNamed: 'Открыть папку %{name}',
}

if (typeof Uppy !== 'undefined') {
  globalThis.Uppy.locales.ru_RU = ru_RU
}

export default ru_RU
