import type { Locale } from '@uppy/utils'

const hu_HU: Locale<0> = {
  strings: {},
  pluralize() {
    return 0
  },
}

hu_HU.strings = {
  addMore: 'Adj hozzá többet',
  addMoreFiles: 'További fájlok hozzáadása',
  addingMoreFiles: 'További fájlok hozzáadása',
  allowAccessDescription:
    'A képek vagy videó felvételéhez, kérjük engedélyezze a kamera használatát ezen az oldalon.',
  allowAccessTitle: 'Engedélyezze a kamera használatát',
  authenticateWith: 'Kapcsolódás a %{pluginName}-val',
  authenticateWithTitle:
    'Kérjük lépjen be a %{pluginName}-ba a fájlok kiválasztásához',
  back: 'Vissza',
  browse: 'válasszon',
  browseFiles: 'válasszon',
  browseFolders: 'válasszon mappát',
  cancel: 'Mégse',
  cancelUpload: 'Feltöltés megszakítása',
  closeModal: 'Ablak bezárása',
  companionError: 'A Companion-hoz történő kapcsolódás nem sikerült',
  complete: 'Kész',
  connectedToInternet: 'Kapcsolódott az internethez',
  copyLink: 'Link másolása',
  copyLinkToClipboardFallback: 'Másolja ki az alábbi URL-t',
  copyLinkToClipboardSuccess: 'Link a vágólapra másolva',
  creatingAssembly: 'Feltöltés előkészítése...',
  creatingAssemblyFailed: 'Transloadit: Nem sikerült létrehozni az Assembly-t',
  dashboardTitle: 'Fájlfeltöltő',
  dashboardWindowTitle: 'Fájlfeltöltő ablak (Escape a bezáráshoz)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  done: 'Kész',
  dropHint: 'Húzza ide a fájlokat',
  dropPasteBoth: 'Húzza ide a fájlokat vagy %{browse}',
  dropPasteFiles: 'Húzza ide a fájlokat vagy %{browse}',
  dropPasteFolders: 'Húzza ide a fájlokat vagy %{browseFolders}',
  dropPasteImportBoth: 'Húzza ide a fájlokat, %{browse} vagy importáljon:',
  dropPasteImportFiles: 'Húzza ide a fájlokat, %{browse} vagy importáljon:',
  dropPasteImportFolders:
    'Húzza ide a fájlokat, %{browseFolders} vagy importáljon:',
  editFile: 'Fájl szerkesztése',
  editImage: 'Kép szerkesztése',
  editing: '%{file} szerkesztése',
  emptyFolderAdded: 'Az üres mappából nem kerültek fájlok hozzáadásra',
  encoding: 'Kódolás...',
  enterCorrectUrl:
    'Érvénytelen URL: Bizonyosodjon meg róla, hogy egy fájlra mutató közvetlen linket ír be',
  enterUrlToImport: 'Adjon meg egy URL-t a fájl importálásához',
  exceedsSize: 'Ez a fájl meghaladja a maximális megengedett méretet %{size}',
  failedToFetch:
    'A Companion-nak nem sikerült az URL letöltése, győzödjön meg az URL helyességéről',
  failedToUpload: '%{file}-t nem sikerült feltölteni',
  fileSource: 'Fájl forrása: %{name}',
  filesUploadedOfTotal: 'A %{smart_count}-ból %{complete} fájl feltöltve',
  filter: 'Szűrő',
  finishEditingFile: 'Fájl szerkesztésének befejezése',
  folderAdded: 'A %{folder}-ból %{smart_count} fájl hozzáadva',
  import: 'Importálás',
  importFrom: 'Importálás innen: %{name}',
  loading: 'Töltés...',
  logOut: 'Kijelentkezés',
  myDevice: 'Eszközöm',
  noFilesFound: 'Nem találhatóak fájlok vagy könyvtárak',
  noInternetConnection: 'Nincsen Internetkapcsolat',
  pause: 'Szünet',
  pauseUpload: 'Feltöltés szüneteltetése',
  paused: 'Szüneteltetve',
  poweredBy: 'Meghajtja az %{uppy}',
  processingXFiles: '%{smart_count} fájl feldolgozása',
  removeFile: 'Fájl törlése',
  resetFilter: 'Szűrő visszaállítása',
  resume: 'Folytatás',
  resumeUpload: 'Feltöltés folytatása',
  retry: 'Újra',
  retryUpload: 'Próbálja újra a feltöltést',
  saveChanges: 'Változtatások mentése',
  selectX: 'Válassza az %{smart_count} lehetőséget',
  smile: 'Csíííz!',
  startRecording: 'Videófeltével indul',
  stopRecording: 'Videófelvétel megáll',
  takePicture: 'Fénykép',
  timedOut: 'A feltöltés elakadt %{seconds} másodpercig, a feltöltés leáll.',
  upload: 'Feltöltés',
  uploadComplete: 'A feltöltés kész',
  uploadFailed: 'Sikertelen feltöltés',
  uploadPaused: 'Szüneteltetett feltöltés',
  uploadXFiles: '%{smart_count} fájl feltöltése',
  uploadXNewFiles: '+%{smart_count} fájl feltöltése',
  uploading: 'Feltölés',
  uploadingXFiles: '+%{smart_count} fájl feltöltése',
  xFilesSelected: '%{smart_count} fájl kiválasztva',
  xMoreFilesAdded: 'további %{smart_count} fájl hozzáadva',
  xTimeLeft: '%{time} van hátra',
  youCanOnlyUploadFileTypes: 'Feltölthető formátumok: %{types}',
  youCanOnlyUploadX: 'Csak %{smart_count} fájl tölthető fel',
  youHaveToAtLeastSelectX: 'Legalább %{smart_count} fájlt ki kell választania',
  selectFileNamed: 'Válaszd ki a fájlt %{name}',
  unselectFileNamed: 'A fájl törlése %{name}',
  openFolderNamed: 'Nyitott mappa %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.hu_HU = hu_HU
}

export default hu_HU
