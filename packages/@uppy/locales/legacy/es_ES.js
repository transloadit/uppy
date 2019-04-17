/* eslint camelcase: 0 */

const es_ES = {}

es_ES.strings = {
  chooseFile: 'Selecciona un fichero',
  youHaveChosen: 'Has seleccionado: %{fileName}',
  orDragDrop: 'o arrástralo aquí',
  filesChosen: {
    0: '%{smart_count} fichero seleccionado',
    1: '%{smart_count} ficheros seleccionados'
  },
  filesUploaded: {
    0: '%{smart_count} fichero subido',
    1: '%{smart_count} ficheros subidos'
  },
  files: {
    0: '%{smart_count} fichero',
    1: '%{smart_count} ficheros'
  },
  uploadFiles: {
    0: 'Subir %{smart_count} fichero',
    1: 'Subir %{smart_count} ficheros'
  },
  selectToUpload: 'Selecciona los ficheros a subir',
  closeModal: 'Cerrar modal',
  upload: 'Subir',
  importFrom: 'Importar ficheros desde',
  dashboardWindowTitle: 'Panel de Uppy (Pulsa escape para cerrar)',
  dashboardTitle: 'Panel de Uppy',
  copyLinkToClipboardSuccess: 'Enlace copiado al portapapeles.',
  copyLinkToClipboardFallback: 'Copiar la siguiente URL',
  done: 'Hecho',
  localDisk: 'Disco local',
  dropPasteImport: 'Arrasta ficheros aquí, pega, importa de alguno de los servicios de arriba o',
  dropPaste: 'Arrastra ficheros aquí, pega o',
  browse: 'navegar',
  fileProgress: 'Progreso: velocidad de subida y tiempo estimado',
  numberOfSelectedFiles: 'Número de ficheros seleccionados',
  uploadAllNewFiles: 'Subir todos los nuevos ficheros'
}

es_ES.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.es_ES = es_ES
}

module.exports = es_ES
