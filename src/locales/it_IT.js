const it_IT = {}

it_IT.strings = {
  chooseFile: 'Seleziona file',
  youHaveChosen: 'Hai scelto: %{fileName}',
  orDragDrop: 'oppure trascina qui',
  filesChosen: {
    0: '%{smart_count} file selezionato',
    1: '%{smart_count} files selezionati'
  },
  filesUploaded: {
    0: '%{smart_count} file caricato',
    1: '%{smart_count} files caricati'
  },
  files: {
    0: '%{smart_count} file',
    1: '%{smart_count} files'
  },
  uploadFiles: {
    0: 'Carica %{smart_count} file',
    1: 'Carica %{smart_count} files'
  },
  selectToUpload: 'Seleziona i files da caricare',
  closeModal: 'Chiudi finestra',
  upload: 'Carica',
  importFrom: 'Importa files da',
  dashboardWindowTitle: 'Uppy Dashboard Window (Premi escape per chiuderla)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Collegamento copiato negli appunti.',
  copyLinkToClipboardFallback: 'Copia il seguente indirizzo',
  done: 'Fatto',
  localDisk: 'Disco locale',
  dropPasteImport: 'Trascina i files qui, incolla, importa da uno dei servizi sopra oppure',
  dropPaste: 'Trascina i files qui, incolla oppure',
  browse: 'sfoglia',
  fileProgress: 'Progresso: velocità di caricamento e tempo rimanente',
  numberOfSelectedFiles: 'Numero di files selezionati',
  uploadAllNewFiles: 'Carica tutti i nuovi files'
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

export default it_IT
