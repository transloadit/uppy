/* eslint camelcase: 0 */

const pl_PL = {}

pl_PL.strings = {
  chooseFile: 'Wybierz plik',
  youHaveChosen: 'Wybrałeś: %{fileName}',
  orDragDrop: 'lub przeciągnij tutaj',
  filesChosen: {
    0: '%{smart_count} wybrany plik',
    1: '%{smart_count} wybrane pliki',
    2: '%{smart_count} wybranych plików'
  },
  filesUploaded: {
    0: '%{smart_count} wysłany plik',
    1: '%{smart_count} wysłane pliki',
    2: '%{smart_count} wysłanych plików'
  },
  files: {
    0: '%{smart_count} plik',
    1: '%{smart_count} pliki',
    2: '%{smart_count} plików'
  },
  uploadFiles: {
    0: 'Wyślij %{smart_count} plik',
    1: 'Wyślij %{smart_count} pliki',
    2: 'Wyślij %{smart_count} plików'
  },
  selectToUpload: 'Wybierz pliki do wysłania',
  closeModal: 'Zamknij okno',
  upload: 'Wyślij',
  importFrom: 'Zaimportuj pliki z',
  dashboardWindowTitle: 'Okno Uppy Dashboard (Wciśnij esc, aby zamknąć)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Link skopiowany do schowka.',
  copyLinkToClipboardFallback: 'Skopiuj poniższy link',
  done: 'Gotowe',
  localDisk: 'Dysk lokalny',
  dropPasteImport: 'Upuść, wklej lub zaimportuj pliki tutaj albo',
  dropPaste: 'Upuść lub wklej pliki tutaj albo',
  browse: 'przeglądaj',
  fileProgress: 'Postęp pliku: prędkość wysyłania i przewidywany pozostały czas',
  numberOfSelectedFiles: 'Ilość wybranych plików',
  uploadAllNewFiles: 'Wyślij wszystkie nowe pliki'
}

pl_PL.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  if (n >= 2 && n <= 4) {
    return 1
  }
  return 2
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.pl_PL = pl_PL
}

module.exports = pl_PL
