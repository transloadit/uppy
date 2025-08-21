import type { Locale } from '@uppy/utils'

const es_ES: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

es_ES.strings = {
  addBulkFilesFailed: {
    '0': 'No se pudo agregar %{smart_count} archivo debido a un error interno',
    '1': 'No se pudieron agregar %{smart_count} archivos debido a errores internos',
  },
  addedNumFiles: 'Se agregó %{numFiles} archivo(s)',
  addingMoreFiles: 'Agregando más archivos',
  additionalRestrictionsFailed:
    'No se cumplieron %{count} restricciones adicionales',
  addMore: 'Agregar más',
  addMoreFiles: 'Agregar más archivos',
  allFilesFromFolderNamed: 'Todos los archivos de la carpeta %{name}',
  allowAccessDescription:
    'Para tomar fotos o grabar videos con tu cámara, por favor permite el acceso a la cámara para este sitio.',
  allowAccessTitle: 'Por favor, permite el acceso a tu cámara',
  allowAudioAccessDescription:
    'Para grabar audio, por favor permite el acceso al micrófono para este sitio.',
  allowAudioAccessTitle: 'Por favor, permite el acceso a tu micrófono',
  aspectRatioLandscape: 'Recortar horizontal (16:9)',
  aspectRatioPortrait: 'Recortar vertical (9:16)',
  aspectRatioSquare: 'Recortar cuadrado',
  authAborted: 'Autenticación cancelada',
  authenticateWith: 'Conectar con %{pluginName}',
  authenticateWithTitle:
    'Por favor, autentícate con %{pluginName} para seleccionar archivos',
  back: 'Atrás',
  browse: 'Navegar',
  browseFiles: 'Navegar por archivos',
  browseFolders: 'Navegar por carpetas',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar subida',
  closeModal: 'Cerrar ventana',
  companionError: 'Error en la conexión con Companion',
  companionUnauthorizeHint:
    'Para desautorizar tu cuenta de %{provider}, por favor ve a %{url}',
  complete: 'Completado',
  compressedX: 'Se ahorró %{size} comprimiendo imágenes',
  compressingImages: 'Comprimiendo imágenes...',
  connectedToInternet: 'Conectado a Internet',
  copyLink: 'Copiar enlace',
  copyLinkToClipboardFallback: 'Copia la siguiente URL',
  copyLinkToClipboardSuccess: 'Enlace copiado al portapapeles',
  creatingAssembly: 'Preparando subida...',
  creatingAssemblyFailed: 'No se pudo crear un Assembly',
  dashboardTitle: 'Cargador de archivos',
  dashboardWindowTitle:
    'Ventana para cargar archivos (Presiona escape para cerrar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  discardRecordedFile: 'Descartar archivo grabado',
  done: 'Hecho',
  dropHint: 'Suelta tus archivos aquí',
  dropPasteBoth: 'Suelta archivos aquí, %{browseFiles} o %{browseFolders}',
  dropPasteFiles: 'Suelta archivos aquí o %{browseFiles}',
  dropPasteFolders: 'Suelta archivos aquí o %{browseFolders}',
  dropPasteImportBoth:
    'Suelta archivos aquí, %{browseFiles}, %{browseFolders} o importar desde:',
  dropPasteImportFiles:
    'Suelta archivos aquí, %{browseFiles} o importar desde:',
  dropPasteImportFolders:
    'Suelta archivos aquí, %{browseFolders} o importar desde:',
  editFile: 'Editar archivo',
  editImage: 'Editar imagen',
  editFileWithFilename: 'Editar archivo %{file}',
  editing: 'Editando %{file}',
  emptyFolderAdded: 'No se agregaron archivos desde la carpeta vacía',
  encoding: 'Codificando...',
  enterCorrectUrl:
    'URL incorrecta: Por favor, asegúrate de ingresar un enlace directo a un archivo',
  enterTextToSearch: 'Ingresa texto para buscar imágenes',
  enterUrlToImport: 'Ingresa la URL para importar un archivo',
  error: 'Error',
  exceedsSize: '%{file} excede el tamaño máximo permitido de %{size}',
  failedToFetch:
    'Companion no pudo recuperar esta URL, por favor asegúrate de que sea correcta',
  failedToUpload: 'No se pudo subir %{file}',
  fileSource: 'Fuente de archivo: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} archivo subido',
    '1': '%{complete} de %{smart_count} archivos subidos',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Terminar edición de archivo',
  flipHorizontal: 'Voltear horizontalmente',
  folderAdded: {
    '0': 'Se agregó %{smart_count} archivo desde %{folder}',
    '1': 'Se agregaron %{smart_count} archivos desde %{folder}',
  },
  folderAlreadyAdded: 'La carpeta "%{folder}" ya fue agregada',
  generatingThumbnails: 'Generando miniaturas...',
  import: 'Importar',
  importFiles: 'Importar archivos desde:',
  importFrom: 'Importar desde %{name}',
  inferiorSize:
    'Este archivo es más pequeño que el tamaño permitido de %{size}',
  loading: 'Cargando...',
  logOut: 'Cerrar sesión',
  micDisabled: 'El acceso al micrófono fue denegado por el usuario',
  missingRequiredMetaField: 'Faltan campos de metadatos obligatorios',
  missingRequiredMetaFieldOnFile:
    'Faltan campos de metadatos obligatorios en %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Falta el campo de metadatos obligatorio: %{fields}.',
    '1': 'Faltan los campos de metadatos obligatorios: %{fields}.',
  },
  myDevice: 'Mi dispositivo',
  noAudioDescription:
    'Para grabar audio, por favor conecta un micrófono u otro dispositivo de entrada de audio',
  noAudioTitle: 'Micrófono no disponible',
  noCameraDescription:
    'Para tomar fotos o grabar video, por favor conecta un dispositivo de cámara',
  noCameraTitle: 'Cámara no disponible',
  noDuplicates:
    "No se puede agregar el archivo duplicado '%{fileName}', ya existe",
  noFilesFound: 'No tienes archivos o carpetas aquí',
  noInternetConnection: 'Sin conexión a Internet',
  noMoreFilesAllowed: 'No se pueden agregar más archivos',
  noSearchResults: 'Lamentablemente, no hay resultados para esta búsqueda',
  openFolderNamed: 'Abrir carpeta %{name}',
  pause: 'Pausar',
  paused: 'En pausa',
  pauseUpload: 'Pausar subida',
  pluginNameAudio: 'Audio',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Cámara',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Desarrollado por %{uppy}',
  processingXFiles: {
    '0': 'Procesando %{smart_count} archivo',
    '1': 'Procesando %{smart_count} archivos',
  },
  recording: 'Grabando',
  recordingLength: 'Duración de la grabación %{recording_length}',
  recordingStoppedMaxSize:
    'La grabación se detuvo porque el tamaño del archivo está a punto de exceder el límite',
  recordVideoBtn: 'Grabar video',
  recoveredAllFiles:
    'Se restauraron todos los archivos. Ahora puedes reanudar la subida.',
  recoveredXFiles: {
    '0': 'No pudimos recuperar completamente 1 archivo. Por favor, vuelve a seleccionarlo y reanuda la subida.',
    '1': 'No pudimos recuperar completamente %{smart_count} archivos. Por favor, vuelve a seleccionarlos y reanuda la subida.',
  },
  removeFile: 'Eliminar archivo',
  reSelect: 'Volver a seleccionar',
  resetFilter: 'Restablecer filtro',
  resetSearch: 'Restablecer búsqueda',
  resume: 'Reanudar',
  resumeUpload: 'Reanudar subida',
  retry: 'Reintentar',
  retryUpload: 'Reintentar subida',
  revert: 'Revertir',
  rotate: 'Rotar',
  save: 'Guardar',
  saveChanges: 'Guardar cambios',
  search: 'Buscar',
  searchImages: 'Buscar imágenes',
  selectX: {
    '0': 'Seleccionar %{smart_count}',
    '1': 'Seleccionar %{smart_count}',
  },
  sessionRestored: 'Sesión restaurada',
  showErrorDetails: 'Mostrar detalles del error',
  signInWithGoogle: 'Iniciar sesión con Google',
  smile: '¡Sonríe!',
  startAudioRecording: 'Iniciar grabación de audio',
  startCapturing: 'Iniciar captura de pantalla',
  startRecording: 'Iniciar grabación de video',
  stopAudioRecording: 'Detener grabación de audio',
  stopCapturing: 'Detener captura de pantalla',
  stopRecording: 'Detener grabación de video',
  streamActive: 'Transmisión activa',
  streamPassive: 'Transmisión pasiva',
  submitRecordedFile: 'Enviar archivo grabado',
  takePicture: 'Tomar una foto',
  takePictureBtn: 'Tomar foto',
  timedOut: 'La subida se detuvo durante %{seconds} segundos, abortando.',
  upload: 'Subir',
  uploadComplete: 'Subida completa',
  uploadFailed: 'Error en la subida',
  uploading: 'Subiendo',
  uploadingXFiles: {
    '0': 'Subiendo %{smart_count} archivo',
    '1': 'Subiendo %{smart_count} archivos',
  },
  uploadPaused: 'Subida en pausa',
  uploadStalled:
    'La subida no ha realizado ningún progreso durante %{seconds} segundos. Puedes intentarlo de nuevo.',
  uploadXFiles: {
    '0': 'Subir %{smart_count} archivo',
    '1': 'Subir %{smart_count} archivos',
  },
  uploadXNewFiles: {
    '0': 'Subir +%{smart_count} archivo',
    '1': 'Subir +%{smart_count} archivos',
  },
  xFilesSelected: {
    '0': '%{smart_count} archivo seleccionado',
    '1': '%{smart_count} archivos seleccionados',
  },
  xMoreFilesAdded: {
    '0': 'Se agregó %{smart_count} archivo más',
    '1': 'Se agregaron %{smart_count} archivos más',
  },
  xTimeLeft: '%{time} restante',
  youCanOnlyUploadFileTypes: 'Solo puedes subir: %{types}',
  youCanOnlyUploadX: {
    '0': 'Solo puedes subir %{smart_count} archivo',
    '1': 'Solo puedes subir %{smart_count} archivos',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Debes seleccionar al menos %{smart_count} archivo',
    '1': 'Debes seleccionar al menos %{smart_count} archivos',
  },
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  selectFileNamed: 'Seleccione archivo %{name}',
  unselectFileNamed: 'Deseleccionar archivo %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.es_ES = es_ES
}

export default es_ES
