import type { Locale } from '@uppy/utils'

const nl_NL: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

nl_NL.strings = {
  addBulkFilesFailed: {
    '0': 'Toevoegen van %{smart_count} bestand mislukt door een interne fout',
    '1': 'Toevoegen van %{smart_count} bestanden mislukt door interne fouten',
  },
  addingMoreFiles: 'Bezig met extra bestanden toe te voegen',
  addMore: 'Meer toevoegen',
  addMoreFiles: 'Extra bestanden toevoegen',
  allFilesFromFolderNamed: 'Alle bestanden uit de map %{name}',
  allowAccessDescription:
    "Geef toestemming om foto's of videobeelden te kunnen maken.",
  allowAccessTitle: 'Geef toestemming om je camera te gebruiken',
  allowAudioAccessDescription:
    'Om geluidsopnamen te maken moet U toestemming geven voor deze website',
  allowAudioAccessTitle: 'Geef toestemming om uw microfoon te gebruiken',
  aspectRatioLandscape: 'Landschap knippen (16:9)',
  aspectRatioPortrait: 'Portret knippen (9:16)',
  aspectRatioSquare: 'Vierkant knippen',
  authAborted: 'Authenticatie geannuleerd',
  authenticateWith: 'Verbinden met %{pluginName}',
  authenticateWithTitle: 'Verbind met %{pluginName} om bestanden te selecteren',
  back: 'Terug',
  browse: 'blader',
  browseFiles: 'blader',
  browseFolders: 'blader',
  cancel: 'Annuleer',
  cancelUpload: 'Annuleer upload',
  closeModal: 'Sluit Venster',
  companionError: 'Verbinding met Companion mislukt',
  companionUnauthorizeHint:
    'Om toegang te ontnemen voor uw %{provider} account, ga naar %{url}',
  complete: 'Voltooid',
  compressedX: '%{size} bespaard door het comprimeren van afbeeldingen',
  compressingImages: 'Afbeeldingen aan het comprimeren...',
  connectedToInternet: 'Verbonden met het internet',
  copyLink: 'Kopieer link',
  copyLinkToClipboardFallback: 'Kopieer de onderstaande URL',
  copyLinkToClipboardSuccess: 'Link naar klembord gekopieerd',
  creatingAssembly: 'Upload voorbereiden...',
  creatingAssemblyFailed: 'Transloadit: Kon Assembly niet creëeren',
  dashboardTitle: 'Uppy Dashboard',
  dashboardWindowTitle: 'Uppy Dashboard Venster (Druk escape om te sluiten)',
  dataUploadedOfTotal: '%{complete} van %{total}',
  discardRecordedFile: 'Verwijder opgenomen bestand',
  done: 'Klaar',
  dropHint: 'Sleep hier je bestanden naartoe',
  dropPasteBoth: 'Sleep hier je bestanden naartoe, plak of %{browse}',
  dropPasteFiles: 'Sleep hier je bestanden naartoe, plak of %{browse}',
  dropPasteFolders: 'Sleep hier je bestanden naartoe, plak of %{browse}',
  dropPasteImportBoth:
    'Sleep hier je bestanden naartoe, plak, %{browse} of importeer vanuit',
  dropPasteImportFiles:
    'Sleep hier je bestanden naartoe, plak, %{browse} of importeer vanuit',
  dropPasteImportFolders:
    'Sleep hier je bestanden naartoe, plak, %{browse} of importeer vanuit',
  editFile: 'Bestand aanpassen',
  editImage: 'Afbeelding aanpassen',
  editFileWithFilename: 'Bestand aanpassen %{file}',
  editing: 'Bezig %{file} aan te passen',
  emptyFolderAdded: 'Er werden geen bestanden toegevoegd uit de lege map',
  encoding: 'Coderen...',
  enterCorrectUrl:
    'Ongeldige URL: Zorg dat je een directe link naar een bestand invoert',
  enterTextToSearch: 'Type hier om te zoeken naar plaatjes',
  enterUrlToImport: 'Voeg URL toe om een bestand te importeren',
  exceedsSize:
    '%{file} overschrijdt de maximaal toegelaten bestandsgrootte van %{size}',
  failedToFetch:
    'Companion kan deze URL niet laden, controleer of de URL correct is',
  failedToUpload: 'Kon %{file} niet uploaden',
  fileSource: 'Bronbestand: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} van %{smart_count} bestand geüpload',
    '1': '%{complete} van %{smart_count} bestanden geüpload',
  },
  filter: 'Filter',
  finishEditingFile: 'Klaar met bestand aan te passen',
  flipHorizontal: 'Flip horizontaal',
  folderAdded: {
    '0': '%{smart_count} bestand uit %{folder} toegevoegd',
    '1': '%{smart_count} bestanden uit %{folder} toegevoegd',
  },
  folderAlreadyAdded: 'De map "%{folder}" is al toegevoegd',
  generatingThumbnails: 'Thumbnails genereren...',
  import: 'Importeer',
  importFiles: 'Importeer bestanden van:',
  importFrom: 'Importeer vanuit %{name}',
  inferiorSize: 'Dit bestand is kleiner dat de minimale grootte van %{size}',
  loading: 'Bezig met laden...',
  logOut: 'Uitloggen',
  micDisabled: 'Microfoon toegang geweigerd door de gebruiker',
  missingRequiredMetaField: 'De vereiste metadata ontbreekt',
  missingRequiredMetaFieldOnFile:
    'De vereiste metadata ontbreekt voor %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Deze vereiste metadata ontbreekt: %{fields}.',
    '1': 'Deze vereiste metadata ontbreekt: %{fields}.',
  },
  myDevice: 'Mijn apparaat',
  noAudioDescription:
    'Om audio op te nemen, sluit een microfoon of andere geluidsinput aan',
  noAudioTitle: 'Microfoon niet beschikbaar',
  noCameraDescription:
    "Om foto's en/of video op te nemen, sluit een camera aan",
  noCameraTitle: 'Camera niet beschikbaar',
  noDuplicates:
    "Kan het dubbele bestand '%{fileName}' niet toevoegen, deze bestaat al",
  noFilesFound: 'Geen bestanden of mappen gevonden',
  noInternetConnection: 'Geen internetverbinding',
  noMoreFilesAllowed: 'Meer bestanden kunnen niet worden toegevoegd',
  openFolderNamed: 'Open map %{name}',
  pause: 'Pauze',
  paused: 'Gepauzeerd',
  pauseUpload: 'Pauzeer upload',
  poweredBy: 'Mogelijk gemaakt door %{uppy}',
  processingXFiles: {
    '0': 'Bezig met %{smart_count} bestand te verwerken',
    '1': 'Bezig met %{smart_count} bestanden te verwerken',
  },
  recording: 'Aan het opnemen',
  recordingLength: 'Opnameduur %{recording_length}',
  recordingStoppedMaxSize:
    'Opname gestopt omdat de bestandsgrootte de limiet bijna overschrijdt',
  recoveredAllFiles:
    'Alle bestanden zijn herstel. U kunt doorgaan me de upload.',
  recoveredXFiles: {
    '0': 'We konden 1 bestand niet herstellen. Kies het bestand opnieuw en vervolg de upload',
    '1': 'We konden %{smart_count} bestanden niet herstellen. Kies de bestanden opnieuw en vervolg de upload.',
  },
  removeFile: 'Verwijder bestand %{file}',
  reSelect: 'Opnieuw selecteren',
  resetFilter: 'Filter resetten',
  resume: 'Hervatten',
  resumeUpload: 'Upload hervatten',
  retry: 'Opnieuw',
  retryUpload: 'Upload opnieuw',
  revert: 'Terugdraaien',
  rotate: 'Draai',
  save: 'Opslaan',
  saveChanges: 'Wijzigingen opslaan',
  search: 'Zoek',
  searchImages: 'Zoek naar plaatjes',
  selectFileNamed: 'Selecteer bestand %{name}',
  selectX: {
    '0': 'Selecteer %{smart_count}',
    '1': 'Selecteer %{smart_count}',
  },
  sessionRestored: 'Sessie hersteld',
  showErrorDetails: 'Laat fout details zien',
  signInWithGoogle: 'Inloggen met Google',
  smile: 'Lach!',
  startAudioRecording: 'Start audio-opname',
  startCapturing: 'Start scherm-opname',
  startRecording: 'Start video-opname',
  stopAudioRecording: 'Stop audio-opname',
  stopCapturing: 'Stop scherm-opname',
  stopRecording: 'Stop video-opname',
  streamActive: 'Stream actief',
  streamPassive: 'Stream passief',
  submitRecordedFile: 'Stuur opgenomen bestand',
  takePicture: 'Neem een foto',
  timedOut:
    'Upload al gedurende %{seconds} seconden vastgelopen, bezig afbreken upload.',
  unselectFileNamed: 'Deselecteer bestand %{name}',
  upload: 'Upload',
  uploadComplete: 'Upload voltooid',
  uploadFailed: 'Upload mislukt',
  uploading: 'Bezig met uploaden',
  uploadingXFiles: {
    '0': 'Bezig met %{smart_count} bestand te uploaden',
    '1': 'Bezig met %{smart_count} bestanden te uploaden',
  },
  uploadPaused: 'Upload gepauzeerd',
  uploadXFiles: {
    '0': 'Upload %{smart_count} bestand',
    '1': 'Upload %{smart_count} bestanden',
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} bestand',
    '1': 'Upload +%{smart_count} bestanden',
  },
  xFilesSelected: {
    '0': '%{smart_count} bestand geselecteerd',
    '1': '%{smart_count} bestanden geselecteerd',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} extra bestand toegevoegd',
    '1': '%{smart_count} extra bestanden toegevoegd',
  },
  xTimeLeft: '%{time} over',
  youCanOnlyUploadFileTypes: 'Je kan enkel volgende types uploaden: %{types}',
  youCanOnlyUploadX: {
    '0': 'Je kan slechts %{smart_count} bestand uploaden',
    '1': 'Je kan slechts %{smart_count} bestanden uploaden',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Je moet minstens %{smart_count} bestand selecteren',
    '1': 'Je moet minstens %{smart_count} bestanden selecteren',
  },
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom uit',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.nl_NL = nl_NL
}

export default nl_NL
