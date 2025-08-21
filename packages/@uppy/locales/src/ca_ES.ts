import type { Locale } from '@uppy/utils'

const ca_ES: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

ca_ES.strings = {
  addBulkFilesFailed: {
    '0': "No s'ha pogut afegir %{smart_count} arxiu a causa d'un error intern",
    '1': "No s'han pogut afegir %{smart_count} arxius a causa d'errors interns",
  },
  addedNumFiles: "S'ha afegit %{numFiles} arxiu(s)",
  addingMoreFiles: 'Afegint més arxius',
  additionalRestrictionsFailed:
    "No s'han complert %{count} restriccions addicionals",
  addMore: 'Afegir més',
  addMoreFiles: 'Afegir més arxius',
  allFilesFromFolderNamed: 'Tots els arxius de la carpeta %{name}',
  allowAccessDescription:
    "Per prendre fotos o gravar vídeos amb la teva càmera, si us plau permet l'accés a la càmera per a aquest lloc.",
  allowAccessTitle: "Si us plau, permet l'accés a la teva càmera",
  allowAudioAccessDescription:
    "Per gravar àudio, si us plau permet l'accés al micròfon per a aquest lloc.",
  allowAudioAccessTitle: "Si us plau, permet l'accés al teu micròfon",
  aspectRatioLandscape: 'Retallar horitzontal (16:9)',
  aspectRatioPortrait: 'Retallar vertical (9:16)',
  aspectRatioSquare: 'Retallar quadrat',
  authAborted: 'Autenticació cancel·lada',
  authenticateWith: 'Connecta amb %{pluginName}',
  authenticateWithTitle:
    "Si us plau, autentica't amb %{pluginName} per a seleccionar arxius",
  back: 'Enrere',
  browse: 'Navegar',
  browseFiles: 'Navegar pels arxius',
  browseFolders: 'Navegar per carpetes',
  cancel: 'Cancel·lar',
  cancelUpload: 'Cancel·lar pujada',
  closeModal: 'Tanca finestra',
  companionError: 'Error en la connexió amb Companion',
  companionUnauthorizeHint:
    'Per desautoritzar el teu compte de %{provider}, si us plau ves a %{url}',
  complete: 'Completat',
  compressedX: "S'ha estalviat %{size} comprimint imatges",
  compressingImages: 'Comprimint imatges...',
  connectedToInternet: 'Connectat a Internet',
  copyLink: "Copia l'enllaç",
  copyLinkToClipboardFallback: 'Copia la següent URL',
  copyLinkToClipboardSuccess: 'Enllaç copiat al portapapers',
  creatingAssembly: 'Preparant càrrega...',
  creatingAssemblyFailed: "No s'ha pogut crear un Assembly",
  dashboardTitle: "Carregador d'arxius",
  dashboardWindowTitle:
    "Finestra per a carregar arxius (Prem l'escape per tancar)",
  dataUploadedOfTotal: '%{complete} de %{total}',
  discardRecordedFile: "Descarta l'arxiu gravat",
  done: 'Fet',
  dropHint: 'Deixa els teus arxius aquí',
  dropPasteBoth: 'Deixa arxius aquí, %{browseFiles} o %{browseFolders}',
  dropPasteFiles: 'Deixa arxius aquí o %{browseFiles}',
  dropPasteFolders: 'Deixa arxius aquí o %{browseFolders}',
  dropPasteImportBoth:
    'Deixa arxius aquí, %{browseFiles}, %{browseFolders} o importa des de:',
  dropPasteImportFiles: 'Deixa arxius aquí, %{browseFiles} o importa des de:',
  dropPasteImportFolders:
    'Deixa arxius aquí, %{browseFolders} o importa des de:',
  editFile: "Edita l'arxiu",
  editImage: 'Edita la imatge',
  editFileWithFilename: "Edita l'arxiu %{file}",
  editing: 'Editant %{file}',
  emptyFolderAdded: "No s'han afegit arxius des de la carpeta buida",
  encoding: 'Codificant...',
  enterCorrectUrl:
    "URL incorrecta: Si us plau, assegura't d'ingressar un enllaç directe a un arxiu",
  enterTextToSearch: 'Ingresa text per buscar imatges',
  enterUrlToImport: 'Ingresa la URL per importar un arxiu',
  error: 'Error',
  exceedsSize: '%{file} excedeix la mida màxima permesa de %{size}',
  failedToFetch:
    "Companion no ha pogut recuperar aquesta URL, si us plau assegura't que sigui correcta",
  failedToUpload: "No s'ha pogut carregar %{file}",
  fileSource: "Font d'arxiu: %{name}",
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} arxiu pujat',
    '1': '%{complete} de %{smart_count} arxius pujats',
  },
  filter: 'Filtrar',
  finishEditingFile: "Finalitzar edició d'arxiu",
  flipHorizontal: 'Girar horitzontalment',
  folderAdded: {
    '0': "S'ha afegit %{smart_count} arxiu des de %{folder}",
    '1': "S'han afegit %{smart_count} arxius des de %{folder}",
  },
  folderAlreadyAdded: 'La carpeta "%{folder}" ja s\'ha afegit',
  generatingThumbnails: 'Generant miniatures...',
  import: 'Importar',
  importFiles: 'Importar arxius des de:',
  importFrom: 'Importar des de %{name}',
  inferiorSize: 'Aquest arxiu és més petit que la mida permesa de %{size}',
  loading: 'Carregant...',
  logOut: 'Tancar sessió',
  micDisabled: "L'accés al micròfon va ser denegat per l'usuari",
  missingRequiredMetaField: 'Falten camps de metadades obligatoris',
  missingRequiredMetaFieldOnFile:
    'Falten camps de metadades obligatoris a %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Falta el camp de metadades obligatori: %{fields}.',
    '1': 'Falten els camps de metadades obligatoris: %{fields}.',
  },
  myDevice: 'El meu dispositiu',
  noAudioDescription:
    "Per gravar àudio, si us plau connecta un micròfon o un altre dispositiu d'entrada d'àudio",
  noAudioTitle: 'Micròfon no disponible',
  noCameraDescription:
    'Per prendre fotos o gravar vídeo, si us plau connecta un dispositiu de càmera',
  noCameraTitle: 'Càmera no disponible',
  noDuplicates: "No es pot afegir l'arxiu duplicat '%{fileName}', ja existeix",
  noFilesFound: 'No tens arxius o carpetes aquí',
  noInternetConnection: 'Sense connexió a Internet',
  noMoreFilesAllowed: 'No es poden afegir més arxius',
  noSearchResults: 'Lamentablement, no hi ha resultats per a aquesta cerca',
  openFolderNamed: 'Obrir carpeta %{name}',
  pause: 'Pausar',
  paused: 'En pausa',
  pauseUpload: 'Pausar pujada',
  pluginNameAudio: 'Àudio',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Càmera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Desenvolupat per %{uppy}',
  processingXFiles: {
    '0': 'Processant %{smart_count} arxiu',
    '1': 'Processant %{smart_count} arxius',
  },
  recording: 'Enregistrament',
  recordingLength: "Durada de l'enregistrament %{recording_length}",
  recordingStoppedMaxSize:
    "L'enregistrament s'ha aturat perquè la mida de l'arxiu està a punt de superar el límit",
  recordVideoBtn: 'Enregistrar vídeo',
  recoveredAllFiles:
    "S'han restaurat tots els arxius. Ara pots reprendre la pujada.",
  recoveredXFiles: {
    '0': 'No vam poder recuperar completament 1 arxiu. Si us plau, torna a seleccionar-lo i reprengues la pujada.',
    '1': 'No vam poder recuperar completament %{smart_count} arxius. Si us plau, torna a seleccionar-los i reprengues la pujada.',
  },
  removeFile: 'Eliminar arxiu',
  reSelect: 'Tornar a seleccionar',
  resetFilter: 'Restablir filtre',
  resetSearch: 'Restablir cerca',
  resume: 'Reprendre',
  resumeUpload: 'Reprendre pujada',
  retry: 'Tornar a intentar',
  retryUpload: 'Tornar a intentar pujada',
  revert: 'Revertir',
  rotate: 'Rotar',
  save: 'Desar',
  saveChanges: 'Desar canvis',
  search: 'Cercar',
  searchImages: 'Cercar imatges',
  selectX: {
    '0': 'Seleccionar %{smart_count}',
    '1': 'Seleccionar %{smart_count}',
  },
  sessionRestored: 'Sessió restaurada',
  showErrorDetails: "Mostrar detalls de l'error",
  signInWithGoogle: 'Iniciar sessió amb Google',
  smile: '¡Somriu!',
  startAudioRecording: "Iniciar enregistrament d'àudio",
  startCapturing: 'Iniciar captura de pantalla',
  startRecording: 'Iniciar enregistrament de vídeo',
  stopAudioRecording: "Aturar enregistrament d'àudio",
  stopCapturing: 'Aturar captura de pantalla',
  stopRecording: 'Aturar enregistrament de vídeo',
  streamActive: 'Transmissió activa',
  streamPassive: 'Transmissió passiva',
  submitRecordedFile: 'Enviar arxiu enregistrat',
  takePicture: 'Fer una foto',
  takePictureBtn: 'Capturar foto',
  timedOut: "La pujada s'ha aturat durant %{seconds} segons, avortant.",
  upload: 'Pujar',
  uploadComplete: 'Pujada completa',
  uploadFailed: 'Error en la pujada',
  uploading: 'Pujant',
  uploadingXFiles: {
    '0': 'Pujant %{smart_count} arxiu',
    '1': 'Pujant %{smart_count} arxius',
  },
  uploadPaused: 'Pujada en pausa',
  uploadStalled:
    'La pujada no ha realitzat cap progrés durant %{seconds} segons. Pots intentar-ho de nou.',
  uploadXFiles: {
    '0': 'Pujar %{smart_count} arxiu',
    '1': 'Pujar %{smart_count} arxius',
  },
  uploadXNewFiles: {
    '0': 'Pujar +%{smart_count} arxiu',
    '1': 'Pujar +%{smart_count} arxius',
  },
  xFilesSelected: {
    '0': '%{smart_count} arxiu seleccionat',
    '1': '%{smart_count} arxius seleccionats',
  },
  xMoreFilesAdded: {
    '0': "S'ha afegit %{smart_count} arxiu més",
    '1': "S'han afegit %{smart_count} arxius més",
  },
  xTimeLeft: '%{time} restant',
  youCanOnlyUploadFileTypes: 'Només pots pujar: %{types}',
  youCanOnlyUploadX: {
    '0': 'Només pots pujar %{smart_count} arxiu',
    '1': 'Només pots pujar %{smart_count} arxius',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Has de seleccionar com a mínim %{smart_count} arxiu',
    '1': 'Has de seleccionar com a mínim %{smart_count} arxius',
  },
  zoomIn: 'Apropar',
  zoomOut: 'Allunyar',
  selectFileNamed: 'Selecciona arxiu %{name}',
  unselectFileNamed: 'Desselecciona arxiu %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ca_ES = ca_ES
}

export default ca_ES
