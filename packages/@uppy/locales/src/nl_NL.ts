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
  addedNumFiles: '%{numFiles} bestand(en) toegevoegd',
  addingMoreFiles: 'Bezig met extra bestanden toe te voegen',
  additionalRestrictionsFailed:
    'Er werd niet voldaan aan %{count} additionele restricties',
  addMore: 'Meer toevoegen',
  addMoreFiles: 'Meer bestanden toevoegen',
  aggregateExceedsSize:
    'Je selecteerde %{size} aan bestanden, maar maximaal %{sizeAllowed} is toegestaan',
  allFilesFromFolderNamed: 'Alle bestanden uit de map %{name}',
  allowAccessDescription:
    "Geef deze site toegang tot je camera om foto's of videobeelden te kunnen maken.",
  allowAccessTitle: 'Geef toegang tot je camera',
  allowAudioAccessDescription:
    'Geef deze site toegang tot je microfoon om geluidsopnames te maken.',
  allowAudioAccessTitle: 'Geef toegang tot je microfoon',
  aspectRatioLandscape: 'Landschap knippen (16:9)',
  aspectRatioPortrait: 'Portret knippen (9:16)',
  aspectRatioSquare: 'Vierkant knippen',
  authAborted: 'Authenticatie geannuleerd',
  authenticate: 'Verbinden',
  authenticateWith: 'Verbinden met %{pluginName}',
  authenticateWithTitle: 'Verbind met %{pluginName} om bestanden te selecteren',
  back: 'Terug',
  browse: 'blader',
  browseFiles: 'blader naar bestanden',
  browseFolders: 'blader naar mappen',
  cancel: 'Annuleer',
  cancelUpload: 'Annuleer upload',
  closeModal: 'Sluit venster',
  companionError: 'Verbinding met Companion mislukt',
  companionUnauthorizeHint:
    'Om toegang te ontnemen voor je %{provider} account, ga naar %{url}',
  complete: 'Voltooid',
  compressedX: '%{size} bespaard door afbeeldingen te comprimeren',
  compressingImages: 'Afbeeldingen aan het comprimeren...',
  connectedToInternet: 'Verbonden met het internet',
  copyLink: 'Kopieer link',
  copyLinkToClipboardFallback: 'Kopieer de onderstaande URL',
  copyLinkToClipboardSuccess: 'Link naar klembord gekopieerd',
  creatingAssembly: 'Upload voorbereiden...',
  creatingAssemblyFailed: 'Transloadit: Kon Assembly niet aanmaken',
  dashboardTitle: 'Uppy Dashboard',
  dashboardWindowTitle: 'Uppy Dashboard Venster (Druk escape om te sluiten)',
  dataUploadedOfTotal: '%{complete} van %{total}',
  dataUploadedOfUnknown: '%{complete} van onbekend',
  discardMediaFile: 'Verwijder Media',
  discardRecordedFile: 'Verwijder opgenomen bestand',
  done: 'Klaar',
  dropHereOr: 'Sleep bestanden hier heen of %{browse}',
  dropHint: 'Sleep bestanden hier heen',
  dropPasteBoth:
    'Sleep bestanden hier heen, %{browseFiles} of %{browseFolders}',
  dropPasteFiles: 'Sleep bestanden hier heen of %{browseFiles}',
  dropPasteFolders: 'Sleep bestanden hier heen of %{browseFolders}',
  dropPasteImportBoth:
    'Sleep bestanden hier heen, %{browseFiles}, %{browseFolders} of importeer vanuit:',
  dropPasteImportFiles:
    'Sleep bestanden hier heen, %{browseFiles} of importeer vanuit:',
  dropPasteImportFolders:
    'Sleep bestanden hier heen, %{browseFolders} of importeer vanuit:',
  editFile: 'Bestand wijzigen',
  editFileWithFilename: 'Wijzig bestand %{file}',
  editImage: 'Afbeelding wijzigen',
  editing: 'Bezig %{file} te wijzigen',
  emptyFolderAdded: 'Er werden geen bestanden toegevoegd uit de lege map',
  encoding: 'Encoderen...',
  enterCorrectUrl:
    'Ongeldige URL: Zorg dat je een directe link naar een bestand invoert',
  enterTextToSearch: 'Type hier om te zoeken naar afbeeldingen',
  enterUrlToImport: 'Voer een URL in om een bestand te importeren',
  error: 'Fout',
  exceedsSize:
    '%{file} overschrijdt de maximaal toegelaten bestandsgrootte van %{size}',
  failedToFetch:
    'Companion kan deze URL niet laden, controleer of de URL correct is',
  failedToUpload: 'Kon %{file} niet uploaden',
  filesUploadedOfTotal: {
    '0': '%{complete} van %{smart_count} bestand geüpload',
    '1': '%{complete} van %{smart_count} bestanden geüpload',
  },
  filter: 'Filter',
  finishEditingFile: 'Klaar met bestand te wijzigen',
  flipHorizontal: 'Horizontaal spiegelen',
  folderAdded: {
    '0': '%{smart_count} bestand toegevoegd uit %{folder}',
    '1': '%{smart_count} bestanden toegevoegd uit %{folder}',
  },
  folderAlreadyAdded: 'De map "%{folder}" werd reeds toegevoegd',
  generatingThumbnails: 'Thumbnails genereren...',
  import: 'Importeer',
  importFiles: 'Bestanden importeren van:',
  importFrom: 'Bestanden importeren vanuit %{name}',
  inferiorSize: 'Dit bestand is kleiner dan de minimum grootte van %{size}',
  loadedXFiles: '%{numFiles} bestanden geladen',
  loading: 'Bezig met laden...',
  logIn: 'Inloggen',
  logOut: 'Uitloggen',
  micDisabled: 'Microfoon toegang geweigerd door gebruiker',
  missingRequiredMetaField: 'Vereiste metadata ontbreekt',
  missingRequiredMetaFieldOnFile: 'Vereiste metadata ontbreekt in %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Ontbrekende metadata: %{fields}.',
    '1': 'Ontbrekende metadata: %{fields}.',
  },
  myDevice: 'Mijn apparaat',
  noAudioDescription:
    'Sluit een microfoon of andere geluidsinput aan om een geluidsopname te maken',
  noAudioTitle: 'Microfoon niet beschikbaar',
  noCameraDescription:
    "Sluit een camera aan om foto's of videobeelden te maken",
  noCameraTitle: 'Camera niet beschikbaar',
  noDuplicates:
    "Kan het dubbele bestand '%{fileName}' niet toevoegen, het bestaat al",
  noFilesFound: 'Geen bestanden of mappen gevonden',
  noInternetConnection: 'Geen verbinding met het internet',
  noMoreFilesAllowed: 'Meer bestanden kunnen niet toegevoegd worden',
  noSearchResults: 'Deze zoekopdracht leverde helaas geen resultaten op',
  openFolderNamed: 'Open map %{name}',
  pause: 'Pauze',
  paused: 'Gepauzeerd',
  pauseUpload: 'Upload pauzeren',
  pickFiles: 'Selecteer bestanden',
  pickPhotos: "Selecteer foto's",
  pleaseWait: 'Gelieve te wachten',
  pluginNameAudio: 'Audio',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Camera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameGoogleDrivePicker: 'Google Drive',
  pluginNameGooglePhotosPicker: 'Google Photos',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Screencast',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Link',
  pluginNameWebdav: 'WebDAV',
  pluginNameZoom: 'Zoom',
  pluginWebdavInputLabel:
    'WebDAV URL naar een bestand (bijv. van ownCloud of Nextcloud)',
  poweredBy: 'Mogelijk gemaakt door %{uppy}',
  processingXFiles: {
    '0': 'Bezig met verwerken van %{smart_count} bestand',
    '1': 'Bezig met verwerken van %{smart_count} bestanden',
  },
  recording: 'Aan het opnemen',
  recordingLength: 'Opnameduur %{recording_length}',
  recordingStoppedMaxSize:
    'Opname gestopt omdat de bestandsgrootte de limiet bijna overschrijdt',
  recordVideoBtn: 'Video opnemen',
  recoveredAllFiles:
    'We hebben alle bestanden hersteld. Je kan de upload nu hervatten.',
  recoveredXFiles: {
    '0': 'We konden 1 bestand niet herstellen. Kies het bestand opnieuw en hervat de upload.',
    '1': 'We konden %{smart_count} bestanden niet herstellen. Kies de bestanden opnieuw en hervat de upload.',
  },
  removeFile: 'Verwijder bestand',
  reSelect: 'Opnieuw selecteren',
  resetFilter: 'Filter resetten',
  resetSearch: 'Zoeken resetten',
  resume: 'Hervatten',
  resumeUpload: 'Upload hervatten',
  retry: 'Opnieuw proberen',
  retryUpload: 'Upload opnieuw proberen',
  revert: 'Terugdraaien',
  rotate: 'Draai 90°',
  save: 'Opslaan',
  saveChanges: 'Wijzigingen opslaan',
  search: 'Zoeken',
  searchImages: "Foto's zoeken",
  selectX: {
    '0': 'Selecteer %{smart_count}',
    '1': 'Selecteer %{smart_count}',
  },
  sessionRestored: 'Sessie hersteld',
  showErrorDetails: 'Toon foutdetails',
  signInWithGoogle: 'Inloggen met Google',
  smile: 'Lachen!',
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
  takePictureBtn: 'Foto nemen',
  takeScreenshot: 'Screenshot maken',
  unnamed: 'Onbekend',
  upload: 'Upload',
  uploadComplete: 'Upload voltooid',
  uploadFailed: 'Upload mislukt',
  uploading: 'Aan het uploaden',
  uploadingXFiles: {
    '0': '%{smart_count} bestand aan het uploaden',
    '1': '%{smart_count} bestanden aan het uploaden',
  },
  uploadPaused: 'Upload gepauzeerd',
  uploadStalled:
    'Upload maakte geen vordering gedurende %{seconds} seconden. Probeer opnieuw.',
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
  xTimeLeft: '%{time} resterend',
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
