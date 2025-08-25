import type { Locale } from '@uppy/utils'

const it_IT: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

it_IT.strings = {
  addMoreFiles: 'Aggiungi più file',
  addingMoreFiles: 'Sto aggiungendo altri file',
  allowAccessDescription:
    "Per acquisire foto o video con la tua fotocamera, abilitane l'accesso da questo sito.",
  allowAccessTitle: "Abilita l'accesso alla fotocamera",
  authenticateWith: 'Connetti a %{pluginName}',
  authenticateWithTitle: 'Autenticati con %{pluginName} per selezionare i file',
  back: 'Indietro',
  addMore: 'Aggiungi più',
  browse: 'sfoglia',
  browseFiles: 'sfoglia',
  cancel: 'Annulla',
  cancelUpload: 'Annulla upload',
  closeModal: 'Chiudi modale',
  companionError: 'Connessione con Companion fallita',
  complete: 'Completato',
  connectedToInternet: 'Connesso a internet',
  copyLink: 'Copia link',
  copyLinkToClipboardFallback: "Copia l'URL sottostante",
  copyLinkToClipboardSuccess: 'Link copiato',
  creatingAssembly: 'Upload in preparazione...',
  creatingAssemblyFailed: "Transloadit: Non ho potuto creare l'Assembly",
  dashboardTitle: 'File Uploader',
  dashboardWindowTitle: 'File Uploader (Premi Esc per chiudere)',
  dataUploadedOfTotal: '%{complete} di %{total}',
  done: 'Fatto',
  dropHint: 'Trascina i file qui',
  dropPasteBoth: 'Trascina i file qui, incolla o %{browse}',
  dropPasteFiles: 'Trascina i file qui, incolla o %{browse}',
  dropPasteFolders: 'Trascina i file qui, incolla o %{browse}',
  dropPasteImportBoth: 'Trascina i file qui, incolla, %{browse} o importa da',
  dropPasteImportFiles: 'Trascina i file qui, incolla, %{browse} o importa da',
  dropPasteImportFolders:
    'Trascina i file qui, incolla, %{browse} o importa da',
  editFile: 'Modifica file',
  editImage: 'Modifica immagine',
  editing: 'Modifica %{file}',
  emptyFolderAdded: 'Nessun file aggiunto dalla cartella vuota',
  encoding: 'Encoding...',
  enterCorrectUrl:
    'URL non corretta: assicurati che sia un link diretto ad un file',
  enterUrlToImport: "Immetti l'URL per importare un file",
  exceedsSize: 'Questo file supera la dimensione massima di %{size}',
  failedToFetch:
    'Impossibile verificare questa URL, assicurati che sia corretta',
  failedToUpload: 'Upload del file %{file} non riuscito',
  fileSource: 'Sorgente file: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} di %{smart_count} file caricato',
    '1': '%{complete} di %{smart_count} file caricati',
  },
  filter: 'Filter',
  finishEditingFile: 'Finish editing file',
  folderAdded: {
    '0': 'Aggiunto %{smart_count} file da %{folder}',
    '1': 'Aggiunti %{smart_count} file da %{folder}',
  },
  import: 'Importa',
  importFrom: 'Importa da %{name}',
  loading: 'Caricamento...',
  logOut: 'Logout',
  myDevice: 'Il mio computer',
  noFilesFound: 'Non hai file o cartelle qui',
  noInternetConnection: 'Nessuna connessione a internet',
  pause: 'Pausa',
  pauseUpload: 'Pausa upload',
  paused: 'In pausa',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': 'Sto processando %{smart_count} file',
    '1': 'Sto processando %{smart_count} file',
  },
  removeFile: 'Rimuovi il file',
  resetFilter: 'Ripristina filtro',
  resume: 'Riprendi',
  resumeUpload: "Riprendi l'upload",
  retry: 'Riprova',
  retryUpload: "Riprova l'upload",
  save: 'Salva',
  saveChanges: 'Salva le modifiche',
  selectX: {
    '0': 'Seleziona %{smart_count}',
    '1': 'Seleziona %{smart_count}',
  },
  smile: 'Sorridi!',
  startRecording: 'Inizia la registrazione del video',
  stopRecording: 'Interrompi la registrazione del video',
  takePicture: 'Scatta una foto',
  timedOut: 'Upload fermo da %{seconds} secondi, sto annullando.',
  upload: 'Upload',
  uploadComplete: 'Upload completato',
  uploadFailed: 'Upload non riuscito',
  uploadPaused: 'Upload in pausa',
  uploadXFiles: {
    '0': 'Upload di %{smart_count} file',
    '1': 'Upload di %{smart_count} file',
  },
  uploadXNewFiles: {
    '0': 'Upload +%{smart_count} file',
    '1': 'Upload +%{smart_count} file',
  },
  uploading: 'In caricamento',
  uploadingXFiles: {
    '0': 'Caricando %{smart_count} file',
    '1': 'Caricando %{smart_count} file',
  },
  xFilesSelected: {
    '0': '%{smart_count} file selezionato',
    '1': '%{smart_count} file selezionati',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} alto file aggiunto',
    '1': '%{smart_count} altri file aggiunti',
  },
  xTimeLeft: '%{time} rimasto',
  youCanOnlyUploadFileTypes: 'Puoi caricare solamente: %{types}',
  youCanOnlyUploadX: {
    '0': 'Puoi caricare %{smart_count} solo file',
    '1': 'Puoi caricare solo %{smart_count} file',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Devi selezionare almeno %{smart_count} file',
    '1': 'Devi selezionare almeno %{smart_count} file',
  },
  selectFileNamed: 'Seleziona il file %{name}',
  unselectFileNamed: 'Deseleziona il file %{name}',
  openFolderNamed: 'Cartella aperta %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.it_IT = it_IT
}

export default it_IT
