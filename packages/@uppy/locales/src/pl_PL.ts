import type { Locale } from '@uppy/utils'

const pl_PL: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

pl_PL.strings = {
  addBulkFilesFailed: {
    '0': 'Dodawanie %{smart_count} pliku nie powiodło się z powodu błędu',
    '1': 'Dodawanie %{smart_count} plików nie powiodło się z powodu błędów',
  },
  addMore: 'Dodaj więcej',
  addMoreFiles: 'Dodaj więcej plików',
  addingMoreFiles: 'Dodawanie kolejnych plików',
  allowAccessDescription:
    'Aby zrobić zdjęcie lub nagrać filmik z użyciem wbudowanego aparatu, zezwól stronie na dostęp do aparatu',
  allowAccessTitle: 'Zezwól na dostęp do aparatu',
  authenticateWith: 'Połącz z %{pluginName}',
  authenticateWithTitle: 'Zaloguj się do %{pluginName} aby wybrać pliki',
  back: 'Wstecz',
  browse: 'Wybierz',
  browseFiles: 'Przeglądaj pliki',
  cancel: 'Anuluj',
  cancelUpload: 'Anuluj przesyłanie',
  closeModal: 'Zamknij',
  companionError: 'Połączenie z serwisem nie powiodło się',
  companionUnauthorizeHint:
    'Aby wylogować się z konta %{provider}, przejdź pod adres %{url}',
  complete: 'Ukończono',
  connectedToInternet: 'Połączono z Internetem',
  copyLink: 'Skopiuj link',
  copyLinkToClipboardFallback: 'Skopiuj poniższy adres URL',
  copyLinkToClipboardSuccess: 'Link skopiowany do schowka',
  creatingAssembly: 'Przygotowywanie wysyłania...',
  creatingAssemblyFailed: 'Transloadit: Niepowodzenie przy tworzeniu zbioru',
  dashboardTitle: 'Przesyłanie plików',
  dashboardWindowTitle: 'Okno przesyłania plików (Naciśnij ESC aby zamknąć)',
  dataUploadedOfTotal: 'Przesłano %{complete} z %{total}',
  done: 'Ukończono',
  dropHint: 'Upuść swoje pliki tutaj',
  dropPasteBoth: 'Upuść pliki tutaj, wklej, albo %{browse}',
  dropPasteFiles: 'Upuść pliki tutaj, wklej, albo %{browse}',
  dropPasteFolders: 'Upuść foldery tutaj, wklej, albo %{browse}',
  dropPasteImportBoth: 'Upuść pliki tutaj, wklej, %{browse} albo zaimportuj z',
  dropPasteImportFiles: 'Upuść pliki tutaj, wklej, %{browse} albo zaimportuj z',
  dropPasteImportFolders:
    'Upuść foldery tutaj, wklej, %{browse} albo zaimportuj z',
  editFile: 'Edytuj plik',
  editImage: 'Edytuj obraz',
  editing: 'Edycja %{file}',
  emptyFolderAdded: 'Z pustego folderu nie zostały dodane żadne pliki',
  encoding: 'Transkodowanie...',
  enterCorrectUrl:
    'Niepoprawny URL: Upewnij się, że wprowadzasz bezpośredni adres pliku',
  enterUrlToImport: 'Wprowadź URL, aby zaimportować plik',
  exceedsSize: 'Plik ma rozmiar większy od dozwolonego %{size}',
  failedToFetch:
    'Serwis nie mógł przetworzyć podanego linku, zweryfikuj jego poprawność',
  failedToUpload: 'Przesyłanie %{file} nie powiodło się',
  fileSource: 'Źródło pliku: %{name}',
  filesUploadedOfTotal: {
    '0': 'wysłano %{complete} z %{smart_count} pliku',
    '1': 'wysłano %{complete} z %{smart_count} plików',
  },
  filter: 'Filtr',
  finishEditingFile: 'Zakończ edycję',
  folderAdded: {
    '0': 'Dodano %{smart_count} plik z folderu %{folder}',
    '1': 'Dodano %{smart_count} plików z folderu %{folder}',
  },
  generatingThumbnails: 'Generowanie miniaturek...',
  import: 'Importuj',
  importFrom: 'Importuj z %{name}',
  loading: 'Ładowanie...',
  logOut: 'Wyloguj',
  myDevice: 'Moje urządzenie',
  noDuplicates:
    "Nie można dodać i zduplikować pliku '%{fileName}', już istnieje",
  noFilesFound: 'Nie znaleziono plików',
  noInternetConnection: 'Brak połączenia z Internetem',
  noMoreFilesAllowed: 'Nie można dodać nowych plików: trwa przesyłanie',
  openFolderNamed: 'Otwórz folder %{name}',
  pause: 'Wstrzymaj',
  pauseUpload: 'Wstrzymaj przesyłanie',
  paused: 'Wstrzymano',
  poweredBy: 'Dostarczane przez %{uppy}',
  processingXFiles: {
    '0': 'Przetwarzanie %{smart_count} pliku',
    '1': 'Przetwarzanie %{smart_count} plików',
  },
  recordingLength: 'Długość nagrania %{recording_length}',
  removeFile: 'Usuń filtr',
  resetFilter: 'Zresetuj filtr',
  resume: 'Wznów',
  resumeUpload: 'Wznów przesyłanie',
  retry: 'Ponów próbę',
  retryUpload: 'Ponów próbę przesyłania',
  saveChanges: 'Zapisz zmiany',
  selectFileNamed: 'Wybierz plik %{name}',
  selectX: {
    '0': 'Wybierz %{smart_count}',
    '1': 'Wybierz %{smart_count}',
  },
  smile: 'Uśmiech!',
  startRecording: 'Zacznij nagrywanie wideo',
  stopRecording: 'Zatrzymaj nagrywanie wideo',
  takePicture: 'Zrób zdjęcie',
  timedOut:
    'Przesyłanie wstrzymane przez %{seconds} sekund, przerywanie przesyłania.',
  unselectFileNamed: 'Odznacz plik %{name}',
  upload: 'Wgrywanie',
  uploadComplete: 'Wgrywanie ukończone',
  uploadFailed: 'Wgrywanie nie powiodło się',
  uploadPaused: 'Wgrywanie wstrzymane',
  uploadXFiles: {
    '0': 'Wgraj %{smart_count} plik',
    '1': 'Wgraj %{smart_count} pliki',
  },
  uploadXNewFiles: {
    '0': 'Wgraj +%{smart_count} plik',
    '1': 'Wgraj +%{smart_count} pliki',
  },
  uploading: 'Wgrywanie',
  uploadingXFiles: {
    '0': 'Wgrywanie %{smart_count} pliku',
    '1': 'Wgrywanie %{smart_count} plików',
  },
  xFilesSelected: {
    '0': '%{smart_count} plik zaznaczony',
    '1': '%{smart_count} plików zaznaczonych',
  },
  xMoreFilesAdded: {
    '0': 'dodano %{smart_count} 1 plik więcej',
    '1': 'dodano %{smart_count} pliki więcej',
  },
  xTimeLeft: '%{time} zostało',
  youCanOnlyUploadFileTypes: 'Możesz przesłać tylko: %{types}',
  youCanOnlyUploadX: {
    '0': 'Możesz wgrać tylko %{smart_count} plik',
    '1': 'Możesz wgrać tylko %{smart_count} pliki',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Musisz wybrać przynajmniej %{smart_count} plik',
    '1': 'Musisz wybrać przynajmniej %{smart_count} pliki',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.pl_PL = pl_PL
}

export default pl_PL
