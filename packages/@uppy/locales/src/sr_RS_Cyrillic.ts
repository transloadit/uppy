import type { Locale } from '@uppy/utils'

const sr_RS_Cyrillic: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

sr_RS_Cyrillic.strings = {
  addMore: 'Додај још',
  addMoreFiles: 'Додај још датотека',
  addingMoreFiles: 'Додавање датотека',
  allowAccessDescription:
    'Молимо Вас, дозволите приступ Вашој камери, како бисте могли да је користите за снимање фотографија и видео записа.',
  allowAccessTitle: 'Молимо Вас, дозволите приступ Вашој камери',
  authenticateWith: 'Повежи се путем %{pluginName}',
  authenticateWithTitle:
    'Молимо Вас да се пријавите путем %{pluginName} како бисте преузели датотеке',
  back: 'Назад',
  browse: 'потражи',
  browseFiles: 'потражи',
  cancel: 'Откажи',
  cancelUpload: 'Откажи отпремање',
  closeModal: 'Затвори',
  companionError: 'Неуспело повезивање са Companion',
  complete: 'Отпремљено',
  connectedToInternet: 'Повезан на интернет',
  copyLink: 'Састави линк',
  copyLinkToClipboardFallback: 'Копирај (сачувај) доњи URL',
  copyLinkToClipboardSuccess: 'Линк је копиран у клипборд',
  creatingAssembly: 'Припремање отпремања...',
  creatingAssemblyFailed: 'Transloadit: не могу да направим Assembly',
  dashboardTitle: 'Отпремање датотека',
  dashboardWindowTitle:
    'Прозор за отпремање датотека (притирните ESC за излаз)',
  dataUploadedOfTotal: '%{complete} од %{total}',
  done: 'Завршено',
  dropHint: 'Спусти датотеке овде',
  dropPasteBoth: 'Спусти датотеке овде, уметни или %{browse}',
  dropPasteFiles: 'Спусти датотеке овде, уметни или %{browse}',
  dropPasteFolders: 'Спусти датотеке овде, уметни или %{browse}',
  dropPasteImportBoth:
    'Спусти датотеке овде, уметни (енг. "paste"), %{browse} или преузми са',
  dropPasteImportFiles:
    'Спусти датотеке овде, уметни (енг. "paste"), %{browse} или преузми са',
  dropPasteImportFolders:
    'Спусти датотеке овде, уметни (енг. "paste"), %{browse} или преузми са',
  editFile: 'Измени датотеку',
  editImage: 'Уреди слику',
  editing: 'Мењање  %{file}',
  emptyFolderAdded: 'Ни једна датотека није додата из празног фолдера',
  encoding: 'Шифровање...',
  enterCorrectUrl: 'Погрешан URL: унесите тачну путању до датотеке',
  enterUrlToImport: 'Унесите URL (путању) до датотеке',
  exceedsSize: 'Ова датотека премашује највећу дозвољену величину од %{size}',
  failedToFetch:
    'Companion није успео да допре до дате адресе (URL), проверите исправност адресе',
  failedToUpload: 'Број неуспело отпремљених датотека: %{file}',
  fileSource: 'Датотека: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete}. Укупно отремљених датотека: %{smart_count}',
    '1': '%{complete}. Укупно отремљених датотека: %{smart_count}',
  },
  filter: 'Филтер',
  finishEditingFile: 'Заврши мењање фајла',
  folderAdded: {
    '0': 'Број датотека преузетих из %{folder}: %{smart_count}',
    '1': 'Број датотека преузетих из %{folder}: %{smart_count}',
  },
  import: 'Преузми',
  importFrom: 'Преузми са %{name}',
  loading: 'Учитавам...',
  logOut: 'Одјава',
  myDevice: 'Мој рачунар или мобилни уређај',
  noFilesFound: 'Овде нема фолдера или датотека',
  noInternetConnection: 'Нема везе са интернетом',
  pause: 'Заустави привремено',
  pauseUpload: 'Привремено заустави отпремање',
  paused: 'Привремено заустављено',
  poweredBy: 'Отпремање покреће %{uppy}',
  processingXFiles: {
    '0': 'Обрада датотеке',
    '1': 'Број датотека које се обрађују: %{smart_count}',
  },
  removeFile: 'Уклони дадотеку',
  resetFilter: 'Избриши филтер',
  resume: 'Настави',
  resumeUpload: 'Настави отпремање',
  retry: 'Покушај поново',
  retryUpload: 'Покушај поново да отпремиш',
  saveChanges: 'Сачувај измене',
  selectX: {
    '0': 'Изабери датотеку',
    '1': 'Изабери %{smart_count}',
  },
  smile: 'Осмех!',
  startRecording: 'Започни снимање видео записа',
  stopRecording: 'Заустави снимање видео записа',
  takePicture: 'Сними фотографију',
  timedOut:
    'Прекидамо отпремање јер је застало. Број секунди застоја: %{seconds}.',
  upload: 'Отпреми',
  uploadComplete: 'Отпремање је завршено у целости',
  uploadFailed: 'Отпремање није успело',
  uploadPaused: 'Отпремање је привремено заустављено',
  uploadXFiles: {
    '0': 'Отпреми датотеку',
    '1': 'Отпреми датотеке. Укупно: %{smart_count}',
  },
  uploadXNewFiles: {
    '0': 'Отпреми +%{smart_count} datoteku',
    '1': 'Отпреми датотеке. Укупно: +%{smart_count}',
  },
  uploading: 'Отпремање',
  uploadingXFiles: {
    '0': 'Број датотека које се тренутно отпремају: %{smart_count}',
    '1': 'Број датотека које се тренутно отпремају: %{smart_count}',
  },
  xFilesSelected: {
    '0': 'Број датотека за отпремање: %{smart_count}',
    '1': 'Број датотека за отпремање: %{smart_count}',
  },
  xMoreFilesAdded: {
    '0': 'Број додатих датотека: %{smart_count}',
    '1': 'Број додатих датотека: %{smart_count}',
  },
  xTimeLeft: 'Преостало време %{time} ',
  youCanOnlyUploadFileTypes: 'Можете да отпремите само: %{types}',
  youCanOnlyUploadX: {
    '0': 'Дозвољени број датотека за отпремање: %{smart_count}',
    '1': 'Дозвољени број датотека за отпремање: %{smart_count}',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Изаберите бар једну датотеку',
    '1': 'Изаберите датотеке. Најмање: %{smart_count}',
  },
  selectFileNamed: 'Изаберите фајл %{name}',
  unselectFileNamed: 'Искључите фајл %{name}',
  openFolderNamed: 'Отвори фолдер %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.sr_RS_Cyrillic = sr_RS_Cyrillic
}

export default sr_RS_Cyrillic
