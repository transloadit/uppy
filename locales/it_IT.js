/* eslint camelcase: 0 */

const it_IT = {}

it_IT.strings = {
  chooseFile: 'Seleziona un file',
  youHaveChosen: 'Hai scelto: %{fileName}',
  orDragDrop: 'oppure trascinalo qui',
  filesChosen: {
    0: '%{smart_count} file selezionato',
    1: '%{smart_count} file selezionati'
  },
  filesUploaded: {
    0: '%{smart_count} file caricato',
    1: '%{smart_count} file caricati'
  },
  files: {
    0: '%{smart_count} file',
    1: '%{smart_count} file'
  },
  uploadFiles: {
    0: 'Carica %{smart_count} file',
    1: 'Carica %{smart_count} file'
  },
  selectToUpload: 'Seleziona i file da caricare',
  closeModal: 'Chiudi la finestra',
  upload: 'Carica',
  importFrom: 'Importa i file da',
  dashboardWindowTitle: 'Uppy Dashboard Window (Premi escape per chiuderla)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Collegamento copiato negli appunti.',
  copyLinkToClipboardFallback: 'Copia il seguente indirizzo',
  done: 'Fatto',
  localDisk: 'Disco locale',
  dropPasteImport: 'Trascina i file qui, incolla, importa da uno dei servizi sopra oppure',
  dropPaste: 'Trascina i file qui, incolla oppure',
  browse: 'sfoglia',
  fileProgress: 'Avanzamento del file: velocità di caricamento e tempo rimanente',
  numberOfSelectedFiles: 'Numero di file selezionati',
  uploadAllNewFiles: 'Carica tutti i nuovi file'
}

it_IT.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.it_IT = it_IT
}

module.exports = it_IT
