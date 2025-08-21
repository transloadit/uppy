import type { Locale } from '@uppy/utils'

const da_DK: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

da_DK.strings = {
  addMore: 'Tilføj flere',
  addMoreFiles: 'Tilføj flere filer',
  addingMoreFiles: 'Tilføj flere filer',
  allowAccessDescription:
    'For at kunne tage billeder eller video med dit kamera, skal du tillade adgang til dit kamera for denne side.',
  allowAccessTitle: 'Venligst giv adgang til dit kamera',
  authenticateWith: 'Forbind til %{pluginName}',
  authenticateWithTitle:
    'Venligst autentificer med %{pluginName} for at vælge filer',
  back: 'Tilbage',
  browse: 'gennemse',
  browseFiles: 'gennemse',
  cancel: 'Annuller',
  cancelUpload: 'Annuller upload',
  closeModal: 'Luk Modal',
  companionError: 'Forbindelse til Companion fejlede',
  complete: 'Afsluttet',
  connectedToInternet: 'Forbundet til internettet',
  copyLink: 'Kopier link',
  copyLinkToClipboardFallback: 'Kopier URLen forneden',
  copyLinkToClipboardSuccess: 'Link kopieret til udklipsholderen',
  creatingAssembly: 'Forbereder upload...',
  creatingAssemblyFailed: 'Transloadit: Kunne ikke oprette Assembly',
  dashboardTitle: 'Fil Uploader',
  dashboardWindowTitle: 'Fil Uploader Vindue (Tryk escape for at lukke)',
  dataUploadedOfTotal: '%{complete} af %{total}',
  done: 'Færdig',
  dropHint: 'Træk dine filer her',
  dropPasteBoth: 'Træk filer her, sæt ind eller %{browse}',
  dropPasteFiles: 'Træk filer her, sæt ind eller %{browse}',
  dropPasteFolders: 'Træk filer her, sæt ind eller %{browse}',
  dropPasteImportBoth: 'Træk filer her, sæt ind, %{browse} eller importer fra',
  dropPasteImportFiles: 'Træk filer her, sæt ind, %{browse} eller importer fra',
  dropPasteImportFolders:
    'Træk filer her, sæt ind, %{browse} eller importer fra',
  editFile: 'Rediger fil',
  editImage: 'Rediger billede',
  editing: 'Redigerer %{file}',
  emptyFolderAdded: 'Ingen filer blev tilføjet fra en tom mappe',
  encoding: 'Encoding...',
  enterCorrectUrl:
    'Forkert URL: Venligst sørg for at du indtaster et direkte link til en fil',
  enterUrlToImport: 'Indtast URL for at importerer en fil',
  exceedsSize:
    'Denne fil overskrider den maksimale tilladte størrelse af %{size}',
  failedToFetch:
    'Companion kunne ikke hente denne URL, venligst undersøg om denne er korrekt',
  failedToUpload: 'Fejlede upload af %{file}',
  fileSource: 'Fil kilde: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} af %{smart_count} filer uploaded',
    '1': '%{complete} af %{smart_count} fil uploaded',
  },
  filter: 'Filter',
  finishEditingFile: 'Færddiggør redigering af fil',
  folderAdded: {
    '0': 'Tilføjet %{smart_count} filer fra %{folder}',
    '1': 'Tilføjet %{smart_count} fil fra %{folder}',
  },
  import: 'Importer',
  importFrom: 'Importer fra %{name}',
  loading: 'Loading...',
  logOut: 'Log ud',
  myDevice: 'Min enhed',
  noFilesFound: 'Du har ingen filer eller mapper her',
  noInternetConnection: 'Ingen Internet forbindelse',
  openFolderNamed: 'Åben mappe %{name}',
  pause: 'Pause',
  pauseUpload: 'Pause upload',
  paused: 'Sat på pause',
  poweredBy: 'Drevet af %{uppy}',
  processingXFiles: {
    '0': 'Behandler %{smart_count} filer',
    '1': 'Behandler %{smart_count} fil',
  },
  removeFile: 'Fjern fil',
  resetFilter: 'Nulstil filter',
  resume: 'Genoptag',
  resumeUpload: 'Genoptag upload',
  retry: 'Forsøg igen',
  retryUpload: 'Forsøg upload igen',
  saveChanges: 'Gem ændringer',
  selectFileNamed: 'Vælg fil %{name}',
  selectX: {
    '0': 'Vælg %{smart_count}',
    '1': 'Vælg %{smart_count}',
  },
  smile: 'Smil!',
  startRecording: 'Start video optagelse',
  stopRecording: 'Stop video optagelse',
  takePicture: 'Tag et billede',
  timedOut: 'Upload gået i stå for %{seconds} sekunder, afbryder.',
  unselectFileNamed: 'Afmarker filen %{name}',
  upload: 'Upload',
  uploadComplete: 'Upload færdig',
  uploadFailed: 'Upload fejlede',
  uploadPaused: 'Upload sat på pause',
  uploadXFiles: {
    '0': 'Upload %{smart_count} fil',
    '1': 'Upload %{smart_count} filer',
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} fil',
    '1': 'Upload +%{smart_count} filer',
  },
  uploading: 'Uploader',
  uploadingXFiles: {
    '0': 'Uploader %{smart_count} fil',
    '1': 'Uploader %{smart_count} filer',
  },
  xFilesSelected: {
    '0': '%{smart_count} fil valgt',
    '1': '%{smart_count} filer valgt',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} flere filer tilføjet',
    '1': '%{smart_count} flere filer tilføjet',
  },
  xTimeLeft: '%{time} tilbage',
  youCanOnlyUploadFileTypes: 'Du kan kun uploade: %{types}',
  youCanOnlyUploadX: {
    '0': 'Du kan kun uploade %{smart_count} fil',
    '1': 'Du kan kun uploade %{smart_count} filer',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Du skal vælge mindst %{smart_count} fil',
    '1': 'Du skal vælge mindst %{smart_count} filer',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.da_DK = da_DK
}

export default da_DK
