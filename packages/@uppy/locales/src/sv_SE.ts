import type { Locale } from '@uppy/utils'

const sv_SE: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

sv_SE.strings = {
  addBulkFilesFailed: {
    '0': 'Kunde inte lägga till %{smart_count} fil på grund av ett internt fel',
    '1': 'Kunde inte lägga till %{smart_count} filer på grund av interna fel',
  },
  addedNumFiles: 'Lade till %{numFiles} fil(er)',
  addingMoreFiles: 'Lägger till fler filer',
  additionalRestrictionsFailed:
    '%{count} ytterligare begränsningar uppfylldes inte',
  addMore: 'Lägg till',
  addMoreFiles: 'Lägg till filer',
  aggregateExceedsSize:
    'Du valde %{size} filer, men maximal tillåten storlek är %{sizeAllowed}',
  allFilesFromFolderNamed: 'Alla filer från mappen %{name}',
  allowAccessDescription:
    'För att kunna ta bilder eller spela in video behöver du ge sidan behörighet att använda din kamera.',
  allowAccessTitle: 'Tillåt användning av kameran',
  allowAudioAccessDescription:
    'För att spela in ljud måste du tillåta mikrofonbehörighet för denna sida.',
  allowAudioAccessTitle: 'Tillåt åtkomst till mikrofonen',
  aspectRatioLandscape: 'Beskär liggande (16:9)',
  aspectRatioPortrait: 'Beskär stående (9:16)',
  aspectRatioSquare: 'Beskär fyrkant',
  authAborted: 'Autentisering avbröts',
  authenticate: 'Anslut',
  authenticateWith: 'Anslut till %{pluginName}',
  authenticateWithTitle: 'Anslut till %{pluginName} för att välja filer',
  back: 'Tillbaka',
  browse: 'bläddra',
  browseFiles: 'bläddra',
  browseFolders: 'bläddra mappar',
  cancel: 'Avbryt',
  cancelUpload: 'Avbryt uppladdning',
  closeModal: 'Stäng fönster',
  companionError: 'Anslutning till Companion misslyckades',
  companionUnauthorizeHint:
    'För att koppla bort ditt %{provider}-konto, gå till %{url}',
  complete: 'Klart',
  compressedX: 'Sparade %{size} genom att komprimera bilder',
  compressingImages: 'Komprimerar bilder...',
  connectedToInternet: 'Ansluten till internet',
  copyLink: 'Kopiera länk',
  copyLinkToClipboardFallback: 'Kopiera länken nedanför',
  copyLinkToClipboardSuccess: 'Länken kopierad till urklipp',
  creatingAssembly: 'Förbereder uppladdning...',
  creatingAssemblyFailed: 'Transloadit: Kunde inte skapa Assembly',
  dashboardTitle: 'Filuppladdare',
  dashboardWindowTitle:
    'Uppladdningsfönster (Tryck på Esc-tangenten för att stänga)',
  dataUploadedOfTotal: '%{complete} av %{total}',
  dataUploadedOfUnknown: '%{complete} av okänd storlek',
  discardMediaFile: 'Kasta mediafil',
  discardRecordedFile: 'Kasta inspelad fil',
  done: 'Klart',
  dropHint: 'Släpp dina filer här',
  dropPasteBoth: 'Släpp filer här, %{browseFiles} eller %{browseFolders}',
  dropPasteFiles: 'Släpp filer här eller %{browseFiles}',
  dropPasteFolders: 'Släpp filer här eller %{browseFolders}',
  dropPasteImportBoth:
    'Släpp filer här, %{browseFiles}, %{browseFolders} eller importera från:',
  dropPasteImportFiles: 'Släpp filer här, %{browseFiles} eller importera från:',
  dropPasteImportFolders:
    'Släpp filer här, %{browseFolders} eller importera från:',
  editFile: 'Redigera fil',
  editFileWithFilename: 'Redigera fil %{file}',
  editImage: 'Redigera bild',
  editing: 'Redigerar %{file}',
  emptyFolderAdded: 'Inga filer lades till från en tom mapp',
  encoding: 'Kodar...',
  enterCorrectUrl:
    'Ogiltig URL: Kontrollera att adressen du anger är en direktlänk till en fil.',
  enterUrlToImport: 'Ange URL för att importera en fil',
  error: 'Fel',
  exceedsSize: '%{file} överskrider maximal tillåten storlek på %{size}',
  failedToFetch:
    'Companion kunde inte ladda ner filen, kontrollera att adressen är korrekt',
  failedToUpload: 'Kunde inte ladda upp %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} av %{smart_count} fil uppladdad',
    '1': '%{complete} av %{smart_count} filer uppladdade',
  },
  filter: 'Filtrera',
  finishEditingFile: 'Avsluta redigering av filen',
  flipHorizontal: 'Vänd horisontellt',
  folderAdded: {
    '0': 'La till %{smart_count} fil från %{folder}',
    '1': 'La till %{smart_count} filer från %{folder}',
  },
  folderAlreadyAdded: 'Mappen "%{folder}" har redan lagts till',
  generatingThumbnails: 'Genererar miniatyrer...',
  import: 'Importera',
  importFiles: 'Importera filer från:',
  importFrom: 'Importera från %{name}',
  inferiorSize: 'Filen är mindre än tillåten storlek på %{size}',
  loadedXFiles: 'Laddade %{numFiles} filer',
  loading: 'Laddar...',
  logIn: 'Logga in',
  logOut: 'Logga ut',
  micDisabled: 'Mikrofonåtkomst nekad av användaren',
  missingRequiredMetaField: 'Obligatoriskt metadatfält saknas',
  missingRequiredMetaFieldOnFile:
    'Obligatoriskt metadatfält saknas i %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Obligatoriskt metadatfält saknas: %{fields}.',
    '1': 'Obligatoriska metadatfält saknas: %{fields}.',
  },
  myDevice: 'Min enhet',
  noAudioDescription:
    'Anslut en mikrofon eller annan ljudenhet för att spela in ljud',
  noAudioTitle: 'Mikrofon ej tillgänglig',
  noCameraDescription:
    'Anslut en kamera för att ta bilder eller spela in video',
  noCameraTitle: 'Kamera ej tillgänglig',
  noDuplicates:
    "Kan inte lägga till den dubblerade filen '%{fileName}', den finns redan",
  noFilesFound: 'Du har inga filer eller mappar här',
  noInternetConnection: 'Ingen internetuppkoppling',
  noMoreFilesAllowed: 'Kan inte lägga till fler filer',
  noSearchResults: 'Inga resultat hittades för denna sökning',
  openFolderNamed: 'Öppna mappen %{name}',
  pause: 'Pausa',
  paused: 'Pausad',
  pauseUpload: 'Pausa uppladdning',
  pickFiles: 'Välj filer',
  pickPhotos: 'Välj bilder',
  pleaseWait: 'Vänta...',
  pluginNameAudio: 'Ljud',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Kamera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameGoogleDrivePicker: 'Google Drive',
  pluginNameGooglePhotosPicker: 'Google Foton',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Skärminspelning',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Länk',
  pluginNameWebdav: 'WebDAV',
  pluginNameZoom: 'Zoom',
  pluginWebdavInputLabel:
    'WebDAV URL för en fil (t.ex. från ownCloud eller Nextcloud)',
  poweredBy: 'Drivs av %{uppy}',
  processingXFiles: {
    '0': 'Processerar %{smart_count} fil',
    '1': 'Processerar %{smart_count} filer',
  },
  recording: 'Spelar in',
  recordingLength: 'Inspelningens längd %{recording_length}',
  recordingStoppedMaxSize:
    'Inspelningen stoppades eftersom filstorleken snart överskrider gränsen',
  recordVideoBtn: 'Spela in video',
  recoveredAllFiles:
    'Vi återställde alla filer. Du kan nu återuppta uppladdningen.',
  recoveredXFiles: {
    '0': 'Vi kunde inte helt återställa 1 fil. Välj om den och återuppta uppladdningen.',
    '1': 'Vi kunde inte helt återställa %{smart_count} filer. Välj om dem och återuppta uppladdningen.',
  },
  removeFile: 'Ta bort fil',
  reSelect: 'Välj om',
  resetFilter: 'Nollställ filter',
  resetSearch: 'Nollställ sökning',
  resume: 'Återuppta',
  resumeUpload: 'Återuppta uppladdning',
  retry: 'Försök igen',
  retryUpload: 'Försök igen',
  revert: 'Återställ',
  rotate: 'Rotera 90°',
  save: 'Spara',
  saveChanges: 'Spara ändringar',
  search: 'Sök',
  searchImages: 'Sök efter bilder',
  selectX: {
    '0': 'Välj %{smart_count}',
    '1': 'Välj %{smart_count}',
  },
  sessionRestored: 'Sessionen återställd',
  showErrorDetails: 'Visa felinformation',
  signInWithGoogle: 'Logga in med Google',
  smile: 'Säg omelett!', // translates to "Say cheese!" - which works well in this context in Swedish
  startAudioRecording: 'Starta ljudinspelning',
  startCapturing: 'Starta skärminspelning',
  startRecording: 'Starta inspelning',
  stopAudioRecording: 'Stoppa ljudinspelning',
  stopCapturing: 'Stoppa skärminspelning',
  stopRecording: 'Avbryt inspelning',
  streamActive: 'Ström aktiv',
  streamPassive: 'Ström passiv',
  submitRecordedFile: 'Skicka inspelad fil',
  takePicture: 'Ta en bild',
  takePictureBtn: 'Ta bild',
  takeScreenshot: 'Ta skärmdump',
  unnamed: 'Namnlös',
  upload: 'Ladda upp',
  uploadComplete: 'Uppladdning slutförd',
  uploadFailed: 'Uppladdning misslyckad',
  uploading: 'Laddar upp',
  uploadingXFiles: {
    '0': 'Laddar upp %{smart_count} fil',
    '1': 'Laddar upp %{smart_count} filer',
  },
  uploadPaused: 'Uppladdning pausad',
  uploadStalled:
    'Uppladdningen har stått still i %{seconds} sekunder. Du kanske vill försöka igen.',
  uploadXFiles: {
    '0': 'Ladda upp %{smart_count} fil',
    '1': 'Ladda upp %{smart_count} filer',
  },
  uploadXNewFiles: {
    '0': 'Ladda upp +%{smart_count} fil',
    '1': 'Ladda upp +%{smart_count} filer',
  },
  xFilesSelected: {
    '0': '%{smart_count} fil vald',
    '1': '%{smart_count} filer valda',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} fil tillagd',
    '1': '%{smart_count} filer tillagda',
  },
  xTimeLeft: '%{time} återstår',
  youCanOnlyUploadFileTypes: 'Du kan endast ladda upp: %{types}',
  youCanOnlyUploadX: {
    '0': 'Du kan endast ladda upp %{smart_count} fil',
    '1': 'Du kan endast ladda upp %{smart_count} filer',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Du måste välja minst %{smart_count} fil',
    '1': 'Du måste välja minst %{smart_count} filer',
  },
  zoomIn: 'Zooma in',
  zoomOut: 'Zooma ut',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.sv_SE = sv_SE
}

export default sv_SE
