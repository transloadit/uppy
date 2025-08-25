import type { Locale } from '@uppy/utils'

const es_MX: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

es_MX.strings = {
  addBulkFilesFailed: {
    '0': 'Error al agregar %{smart_count} archivo debido a un error interno',
    '1': 'Error al agregar %{smart_count} archivos debido a errores internos',
  },
  addMore: 'Agregar más',
  addMoreFiles: 'Agregar más archivos',
  addingMoreFiles: 'Agregando más archivos',
  allowAccessDescription:
    'Para tomar fotos o grabar video con su cámara, por favor permita el acceso a la cámara para este sitio.',
  allowAccessTitle: 'Por favor permita el acceso a su cámara',
  aspectRatioLandscape: 'Recortar horizontal (16:9)',
  aspectRatioPortrait: 'Recortar vertical (9:16)',
  aspectRatioSquare: 'Recortar cuadrado',
  authenticateWith: 'Conectar a %{pluginName}',
  authenticateWithTitle:
    'Por favor autentíquese con %{pluginName} para seleccionar archivos',
  back: 'Atrás',
  backToSearch: 'Volver a buscar',
  browse: 'explorar',
  browseFiles: 'explorar archivos',
  browseFolders: 'explorar carpetas',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar subida',
  closeModal: 'Cerrar ventana emergente',
  companionError: 'La conexión con Companion falló',
  companionUnauthorizeHint:
    'Para desautorizar su cuenta de %{provider}, por favor vaya a %{url}',
  complete: 'Completo',
  connectedToInternet: 'Conectado a Internet',
  copyLink: 'Copiar enlace',
  copyLinkToClipboardFallback: 'Copie la URL a continuación',
  copyLinkToClipboardSuccess: 'Enlace copiado al portapapeles',
  creatingAssembly: 'Preparando subida...',
  creatingAssemblyFailed: 'Transloadit: No se pudo crear el ensamblado',
  dashboardTitle: 'Cargador de archivos',
  dashboardWindowTitle:
    'Ventana de cargador de archivos (Presione escape para cerrar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  discardRecordedFile: 'Descartar archivo grabado',
  done: 'Hecho',
  dropHint: 'Suelte sus archivos aquí',
  dropPasteBoth: 'Suelte archivos aquí, %{browseFiles} o %{browseFolders}',
  dropPasteFiles: 'Suelte archivos aquí o %{browseFiles}',
  dropPasteFolders: 'Suelte archivos aquí o %{browseFolders}',
  dropPasteImportBoth:
    'Suelte archivos aquí, %{browseFiles}, %{browseFolders} o importar desde:',
  dropPasteImportFiles:
    'Suelte archivos aquí, %{browseFiles} o importar desde:',
  dropPasteImportFolders:
    'Suelte archivos aquí, %{browseFolders} o importar desde:',
  editFile: 'Editar archivo',
  editImage: 'Editar imagen',
  editing: 'Editando %{file}',
  emptyFolderAdded: 'No se agregaron archivos desde la carpeta vacía',
  encoding: 'Codificando...',
  enterCorrectUrl:
    'URL incorrecta: Asegúrese de ingresar un enlace directo a un archivo',
  enterTextToSearch: 'Ingrese texto para buscar imágenes',
  enterUrlToImport: 'Ingrese URL para importar un archivo',
  exceedsSize: '%{file} excede el tamaño máximo permitido de',
  exceedsSize2: '%{backwardsCompat} %{size}',
  failedToFetch:
    'Companion no pudo obtener esta URL, asegúrese de que sea correcta',
  failedToUpload: 'Error al subir %{file}',
  fileSource: 'Fuente del archivo: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} archivo subido',
    '1': '%{complete} de %{smart_count} archivos subidos',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Terminar de editar archivo',
  flipHorizontal: 'Voltear horizontalmente',
  folderAdded: {
    '0': 'Se agregó %{smart_count} archivo de %{folder}',
    '1': 'Se agregaron %{smart_count} archivos de %{folder}',
  },
  generatingThumbnails: 'Generando miniaturas...',
  import: 'Importar',
  importFiles: 'Importar archivos desde:',
  importFrom: 'Importar desde %{name}',
  inferiorSize:
    'Este archivo es más pequeño que el tamaño permitido de %{size}',
  loading: 'Cargando...',
  logOut: 'Cerrar sesión',
  micDisabled: 'Acceso al micrófono denegado por el usuario',
  myDevice: 'Mi dispositivo',
  noCameraDescription:
    'Para tomar fotos o grabar videos, conecte un dispositivo de cámara',
  noCameraTitle: 'Cámara no disponible',
  noDuplicates:
    "No se puede agregar el archivo duplicado '%{fileName}', ya existe",
  noFilesFound: 'No tiene archivos o carpetas aquí',
  noInternetConnection: 'Sin conexión a Internet',
  noNewAlreadyUploading:
    'No se pueden agregar nuevos archivos: ya se están subiendo',
  openFolderNamed: 'Abrir carpeta %{name}',
  pause: 'Pausar',
  pauseUpload: 'Pausar subida',
  paused: 'En pausa',
  poweredBy: 'Desarrollado por',
  poweredBy2: '%{backwardsCompat} %{uppy}',
  processingXFiles: {
    '0': 'Procesando %{smart_count} archivo',
    '1': 'Procesando %{smart_count} archivos',
  },
  reSelect: 'Volver a seleccionar',
  recording: 'Grabando',
  recordingLength: 'Duración de la grabación %{recording_length}',
  recordingStoppedMaxSize:
    'La grabación se detuvo porque el tamaño del archivo está a punto de exceder el límite',
  recoveredAllFiles:
    'Restauramos todos los archivos. Ahora puede reanudar la subida.',
  recoveredXFiles: {
    '0': 'No pudimos recuperar completamente 1 archivo. Vuelva a seleccionarlo y reanude la subida.',
    '1': 'No pudimos recuperar completamente %{smart_count} archivos. Vuelva a seleccionarlos y reanude la subida.',
  },
  removeFile: 'Eliminar archivo',
  resetFilter: 'Restablecer filtro',
  resume: 'Reanudar',
  resumeUpload: 'Reanudar subida',
  retry: 'Reintentar',
  retryUpload: 'Reintentar subida',
  revert: 'Revertir',
  rotate: 'Rotar',
  save: 'Guardar',
  saveChanges: 'Guardar cambios',
  searchImages: 'Buscar imágenes',
  selectAllFilesFromFolderNamed:
    'Seleccionar todos los archivos de la carpeta %{name}',
  selectFileNamed: 'Seleccionar archivo %{name}',
  selectX: {
    '0': 'Seleccionar %{smart_count}',
    '1': 'Seleccionar %{smart_count}',
  },
  sessionRestored: 'Sesión restaurada',
  smile: '¡Sonríe!',
  startCapturing: 'Comenzar captura de pantalla',
  startRecording: 'Comenzar grabación de video',
  stopCapturing: 'Detener captura de pantalla',
  stopRecording: 'Detener grabación de video',
  streamActive: 'Transmisión activa',
  streamPassive: 'Transmisión pasiva',
  submitRecordedFile: 'Enviar archivo grabado',
  takePicture: 'Tomar una foto',
  timedOut: 'Subida estancada durante %{seconds} segundos, abortando.',
  unselectAllFilesFromFolderNamed:
    'Deseleccionar todos los archivos de la carpeta %{name}',
  unselectFileNamed: 'Deseleccionar archivo %{name}',
  upload: 'Subir',
  uploadComplete: 'Subida completa',
  uploadFailed: 'Error en la subida',
  uploadPaused: 'Subida pausada',
  uploadXFiles: {
    '0': 'Subir %{smart_count} archivo',
    '1': 'Subir %{smart_count} archivos',
  },
  uploadXNewFiles: {
    '0': 'Subir +%{smart_count} archivo',
    '1': 'Subir +%{smart_count} archivos',
  },
  uploading: 'Subiendo',
  uploadingXFiles: {
    '0': 'Subiendo %{smart_count} archivo',
    '1': 'Subiendo %{smart_count} archivos',
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
  youCanOnlyUploadFileTypes: 'Solo puede subir: %{types}',
  youCanOnlyUploadX: {
    '0': 'Solo puede subir %{smart_count} archivo',
    '1': 'Solo puede subir %{smart_count} archivos',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Debe seleccionar al menos %{smart_count} archivo',
    '1': 'Debe seleccionar al menos %{smart_count} archivos',
  },
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.es_MX = es_MX
}

export default es_MX
