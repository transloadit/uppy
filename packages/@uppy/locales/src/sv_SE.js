const sv_SE = {}

sv_SE.strings = {
  addMore: 'Lägg till',
  addMoreFiles: 'Lägg till filer',
  addingMoreFiles: 'Överför filer',
  allowAccessDescription: 'Sidan kräver behörighet till kameran, så att du skall kunna ta bilder eller filma.',
  allowAccessTitle: 'Tillåt användning av kameran, tack',
  authenticateWith: 'Gå till %{pluginName}',
  authenticateWithTitle: '%{pluginName} krävs till igenkänning, så att du kan välja filer.',
  back: 'Tillbaka',
  browse: 'bläddra',
  cancel: 'Avbryt',
  cancelUpload: 'Avbryt överföring',
  chooseFiles: 'Välj filer',
  closeModal: 'Stäng fönster',
  companionAuthError: 'Behörighet krävs',
  companionError: 'Anslutning till Companion misslyckades',
  complete: 'Klart',
  connectedToInternet: 'Kopplat till Internet',
  copyLink: 'Kopiera länken',
  copyLinkToClipboardFallback: 'Kopiera länken nedanför',
  copyLinkToClipboardSuccess: 'Länken kopierad till urklipp',
  creatingAssembly: 'Förbereder överföring',
  creatingAssemblyFailed: 'Transloadit: Skapandet av Assembly misslyckades',
  dashboardTitle: 'Filuppladdare',
  dashboardWindowTitle: 'Nedladdnings fönster (Tryck Esc för att stänga)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  done: 'Klart',
  dropHereOr: 'Släpp filerna här eller %{browse}',
  dropHint: 'Släpp filerna här',
  dropPaste: 'Släpp filerna här, bifoga eller %{browse}',
  dropPasteImport: 'Släpp filerna här, bifoga, %{browse} eller importera',
  edit: 'Redigera',
  editFile: 'Redigera filen',
  editing: 'Redigerar %{file}',
  emptyFolderAdded: 'Inga tillagda filer ur tom mapp',
  encoding: 'Kodar',
  enterCorrectUrl: 'Ogiltig adress: Kontrollera att adressen visar direkt till filen.',
  enterUrlToImport: 'Ge adress för att importera filen',
  exceedsSize: 'Storlek av filen överstiger den tillåtna gränsen',
  failedToFetch: 'Companion kunde inte ladda ner filen, kontrollera att adressen är korrekt',
  failedToUpload: 'Kunde inte skicka filen %{file}',
  fileSource: 'Källa: %{name}',
  filesUploadedOfTotal: {
    0: '%{complete} / %{smart_count} av filen överfört',
    1: '%{complete} / %{smart_count} av filen överfört',
    2: '%{complete} / %{smart_count} av filen överfört'
  },
  filter: 'Filtrera',
  finishEditingFile: 'Avsluta redigering av filen',
  folderAdded: {
    0: '%{folder} tillagd ur mapp %{smart_count}',
    1: '%{folder} tillagd ur mapp %{smart_count}',
    2: '%{folder} tillagd ur mapp %{smart_count}'
  },
  import: 'Importera',
  importFrom: 'Importera från %{name}',
  link: 'Länk',
  loading: 'Laddar',
  logOut: 'Logga ut',
  myDevice: 'Min enhet',
  noFilesFound: 'Du har inga filer eller mappar här',
  noInternetConnection: 'Ingen Internet anslutning',
  openFolderNamed: 'Öppna mapp %{name}',
  pause: 'Avbryt',
  pauseUpload: 'Avbryt överföring',
  paused: 'Avbrutit',
  poweredBy: 'Powered by',
  preparingUpload: 'Förbereder överföring',
  processingXFiles: {
    0: 'Hanterar %{smart_count} filen',
    1: 'Hanterar %{smart_count} filen',
    2: 'Hanterar %{smart_count} filen'
  },
  removeFile: 'Ta bort fil',
  resetFilter: 'Återställ filter',
  resume: 'Fortsätt',
  resumeUpload: 'Fortsätt att överföra',
  retry: 'Försök igen',
  retryUpload: 'Försök igen att överföra',
  saveChanges: 'Spara ändringar',
  selectAllFilesFromFolderNamed: 'Välj alla filer i mappen %{name}',
  selectFileNamed: 'Välj fil %{name}',
  selectX: {
    0: 'Välj %{smart_count}',
    1: 'Välj %{smart_count}',
    2: 'Välj %{smart_count}'
  },
  smile: 'Säg omelett!', // translates to "Say cheese!" - which works well in this context in Swedish
  startRecording: 'Starta inspelning',
  stopRecording: 'Avbryt inspelning',
  takePicture: 'Ta bild',
  timedOut: 'Överföring har fastnat till %{seconds} sekunder, avbryts.',
  unselectAllFilesFromFolderNamed: 'Ta bort val av filen i mappen%{name}',
  unselectFileNamed: 'Ta bort val i filen %{name}',
  upload: 'Skicka',
  uploadComplete: 'Överföring klart',
  uploadFailed: 'Överföring misslyckad',
  uploadPaused: 'Överföring avbrytet',
  uploadXFiles: {
    0: 'Överför %{smart_count} fil',
    1: 'Överför %{smart_count} filer',
    2: 'Överför %{smart_count} filer'
  },
  uploadXNewFiles: {
    0: 'Överför %{smart_count} fil',
    1: 'Överför %{smart_count} filer',
    2: 'Överför %{smart_count} filer'
  },
  uploading: 'Uppladdning',
  uploadingXFiles: {
    0: 'Överför %{smart_count} fil',
    1: 'Överför %{smart_count} filer',
    2: 'Överför %{smart_count} filer'
  },
  xFilesSelected: {
    0: '%{smart_count} fil vald',
    1: '%{smart_count} filer valda',
    2: '%{smart_count} filer valda'
  },
  xMoreFilesAdded: {
    0: '%{smart_count} fil tillagd',
    1: '%{smart_count} filer tillagda',
    2: '%{smart_count} filer tillagda'
  },
  xTimeLeft: '%{time} kvar',
  youCanOnlyUploadFileTypes: 'Du kan skicka endast: %{types}',
  youCanOnlyUploadX: {
    0: 'Du kan endast skicka %{smart_count} fil',
    1: 'Du kan endast skicka %{smart_count} filer',
    2: 'Du kan endast skicka %{smart_count} filer'
  },
  youHaveToAtLeastSelectX: {
    0: 'Du måste välja minst %{smart_count} fil',
    1: 'Du måste välja minst %{smart_count} filer',
    2: 'Du måste välja minst %{smart_count} filer'
  }
}

sv_SE.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.sv_SE = sv_SE
}

module.exports = sv_SE
