import type { Locale } from '@uppy/utils'

const gl_ES: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

gl_ES.strings = {
  addMore: 'Engadir máis',
  addMoreFiles: 'Engadir máis arquivos',
  addingMoreFiles: 'Engadir máis arquivos',
  allowAccessDescription:
    'Para tomar fotos ou grabar video coa túa cámara, por favor permite a este sitio o acceso á cámara.',
  allowAccessTitle: 'Por favor permite o acceso á tua cámara',
  authenticateWith: 'Conectar a %{pluginName}',
  authenticateWithTitle:
    'Por favor autentícate con %{pluginName} para seleccionar arquivos',
  back: 'Atrás',
  browse: 'navegar',
  browseFiles: 'navegar',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar subida',
  closeModal: 'Pechar xanela flotante',
  companionError: 'Conexión con Companion fallou',
  complete: 'Completado',
  connectedToInternet: 'Conectado a Internet',
  copyLink: 'Copiar enlace',
  copyLinkToClipboardFallback: 'Copia a siguiente URL',
  copyLinkToClipboardSuccess: 'Enlace copiado ao portapapeis',
  creatingAssembly: 'Preparando subida...',
  creatingAssemblyFailed: 'Transloadit: Non se puido crear un Assembly',
  dashboardTitle: 'Cargador de arquivos',
  dashboardWindowTitle:
    'Xanela para cargar arquivos (Presiona escape para cerrar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  done: 'Feito',
  dropHint: 'Solta os teus arqivos aquí',
  dropPasteBoth: 'Soltar arquivos aquí, pegar ou %{browse}',
  dropPasteFiles: 'Soltar arquivos aquí, pegar ou %{browse}',
  dropPasteFolders: 'Soltar arquivos aquí, pegar ou %{browse}',
  dropPasteImportBoth:
    'Soltar arquivos aquí, pegar, %{browse} ou importar dende',
  dropPasteImportFiles:
    'Soltar arquivos aquí, pegar, %{browse} ou importar dende',
  dropPasteImportFolders:
    'Soltar arquivos aquí, pegar, %{browse} ou importar dende',
  editFile: 'Editar arquivo',
  editImage: 'Editar imaxe',
  editing: 'Editando %{file}',
  emptyFolderAdded: 'Ningún arquivo foi agregado dende o cartafol vacía',
  encoding: 'Codificando...',
  enterCorrectUrl:
    'URL incorrecta: Por favor asegúrate que estás ingresando un enlace a un arquivo',
  enterUrlToImport: 'Ingresa unha URL para importar un arquivo',
  exceedsSize: 'Este arquivo excede el tamaño máximo de %{size}',
  failedToFetch:
    'Companion non puido recuperar esta URL, por favor asegúrate que sexa correcta',
  failedToUpload: 'Error ao subir %{file}',
  fileSource: 'Fonte de arquivo: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} arquivo subido',
    '1': '%{complete} de %{smart_count} arquivos subidos',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Rematar edición de arquivo',
  folderAdded: {
    '0': 'Engadido %{smart_count} arquivo dende %{folder}',
    '1': 'Engadidos %{smart_count} arquivos dende %{folder}',
  },
  import: 'Importar',
  importFrom: 'Importar dende %{name}',
  loading: 'Cargando...',
  logOut: 'Pechar sesión',
  myDevice: 'O meu Dispositivo',
  noFilesFound: 'Non existen arquivos ou cartafol aquí',
  noInternetConnection: 'Sin conexión a Internet',
  pause: 'Pausar',
  pauseUpload: 'Pausar subida',
  paused: 'En pausa',
  poweredBy: 'Soportado por %{uppy}',
  processingXFiles: {
    '0': 'Procesando %{smart_count} arquivo',
    '1': 'Procesando %{smart_count} arquivos',
  },
  removeFile: 'Eliminar arquivo',
  resetFilter: 'Limpar filtro',
  resume: 'Reanudar',
  resumeUpload: 'Reanudar subida',
  retry: 'Intentar novamente',
  retryUpload: 'Intentar subida novamente',
  saveChanges: 'Gardar cambios',
  selectX: {
    '0': 'Seleccionar %{smart_count}',
    '1': 'Seleccionar %{smart_count}',
  },
  smile: 'Sorrí!',
  startRecording: 'Comezar a grabación de vídeo',
  stopRecording: 'Deter a grabación de vídeo',
  takePicture: 'Tomar unha foto',
  timedOut: 'Subida estancada por %{seconds} segundos, anulando.',
  upload: 'Subir',
  uploadComplete: 'Subida rematada',
  uploadFailed: 'A subida fallou',
  uploadPaused: 'Subida pausada',
  uploadXFiles: {
    '0': 'Subir %{smart_count} arquivo',
    '1': 'Subir %{smart_count} arquivos',
  },
  uploadXNewFiles: {
    '0': 'Subir +%{smart_count} arquivo',
    '1': 'Subir +%{smart_count} arquivos',
  },
  uploading: 'Subindo',
  uploadingXFiles: {
    '0': 'Subindo %{smart_count} arquivo',
    '1': 'Subindo %{smart_count} arquivos',
  },
  xFilesSelected: {
    '0': '%{smart_count} arquivo seleccionado',
    '1': '%{smart_count} arquivos seleccionados',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} arquivo máis engadido',
    '1': '%{smart_count} arquivos máis engadidos',
  },
  xTimeLeft: '%{time} restantes',
  youCanOnlyUploadFileTypes: 'Soamente podes subir: %{types}',
  youCanOnlyUploadX: {
    '0': 'Soamente podes subir %{smart_count} arquivo',
    '1': 'Soamente podes subir %{smart_count} arquivos',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Tes que seleccionar polo menos %{smart_count} arquivo',
    '1': 'Tes que seleccionar polo menos %{smart_count} arquivos',
  },
  selectFileNamed: 'Seleccione arquivo %{name}',
  unselectFileNamed: 'Deseleccionar arquivo %{name}',
  openFolderNamed: 'Cartafol aberto %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.gl_ES = gl_ES
}

export default gl_ES
