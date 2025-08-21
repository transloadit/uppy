import type { Locale } from '@uppy/utils'

const ro_RO: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

ro_RO.strings = {
  addBulkFilesFailed: {
    '0': 'Nu s-a adăugat %{smart_count} fișier datorită unei erori interne',
    '1': 'Nu s-au adăugat %{smart_count} fișiere datorită unei erori interne',
  },
  addMore: 'Adaugă mai multe',
  addMoreFiles: 'Adaugă mai multe fișiere',
  addingMoreFiles: 'Se adaugă mai multe fișiere',
  allowAccessDescription:
    'Pentru a face poze sau înregistra video trebuie să permiți accesul la cameră.',
  allowAccessTitle: 'Vă rugăm permiteți accesul la cameră',
  authenticateWith: 'Conectați-vă cu %{pluginName}',
  authenticateWithTitle:
    'Vă rugăm conectați-vă cu %{pluginName} pentru a selecta fișiere',
  back: 'Înapoi',
  browse: 'rasfoiește',
  browseFiles: 'rasfoiește',
  cancel: 'Anulare',
  cancelUpload: 'Anulează încărcarea',
  closeModal: 'Închide fereastra',
  companionError: 'Conexiunea către Companion nu a reuși',
  companionUnauthorizeHint:
    'Pentru a autoriza contul %{provider}, navigați către %{url}',
  complete: 'Complet',
  connectedToInternet: 'Conectat la Internet',
  copyLink: 'Copiază link',
  copyLinkToClipboardFallback: 'Copiază URL-ul de mai jos',
  copyLinkToClipboardSuccess: 'Link-ul copiat în clipboard',
  creatingAssembly: 'Se pregătește încărcarea...',
  creatingAssemblyFailed: 'Transloadit: Nu se poate crea un Assembly',
  dashboardTitle: 'Încărcare fișier',
  dashboardWindowTitle:
    'Fereastră încărcare fișier (Apasă tasta escape pentru a închide)',
  dataUploadedOfTotal: '%{complete} din %{total}',
  done: 'Finalizat',
  dropHint: 'Trage fișierele tale aici',
  dropPasteBoth: 'Trage fișierele aici, copy/paste sau %{browse}',
  dropPasteFiles: 'Trage fișierele aici, copy/paste sau %{browse}',
  dropPasteFolders: 'Trage fișierele aici, copy/paste sau %{browse}',
  dropPasteImportBoth:
    'Trage fișierele aici, copy/paste, %{browse} sau importă din:',
  dropPasteImportFiles:
    'Trage fișierele aici, copy/paste, %{browse} sau importă din:',
  dropPasteImportFolders:
    'Trage fișierele aici, copy/paste, %{browse} sau importă din:',
  editFile: 'Editează fișier',
  editImage: 'Editează imagine',
  editing: 'Se editează %{file}',
  emptyFolderAdded: 'Nu s-au adăugat fișiere, directorul este gol',
  encoding: 'Encodare...',
  enterCorrectUrl: 'URL incorect: Introduceți un link direct către fișier',
  enterUrlToImport: 'Introduceți URL pentru a importa fișierul',
  exceedsSize: 'Fișierul depășește dimensiunea maximă permisă de %{size}',
  failedToFetch:
    'Companion-ul nu a putut procesa URL-ul, asigură-te că e corect introdus',
  failedToUpload: '%{file} nu a putut fi încărcat',
  fileSource: 'Sursă fișier: %{name}',
  filesUploadedOfTotal: {
    '0': 'Fișier importat %{complete} din %{smart_count}',
    '1': 'Fișiere importate %{complete} din %{smart_count}',
  },
  filter: 'Filtrează',
  finishEditingFile: 'Finalizează editarea fișierului',
  folderAdded: {
    '0': 'S-a adăugat %{smart_count} fișier din %{folder}',
    '1': 'S-au adăugat %{smart_count} fișiere din %{folder}',
  },
  generatingThumbnails: 'Se generează pictogramele...',
  import: 'Importă',
  importFrom: 'Importă din %{name}',
  loading: 'Încărcare...',
  logOut: 'Delogare',
  myDevice: 'Dispozitivul meu',
  noDuplicates: "Nu se poate adăuga fișierul '%{fileName}', acesta există deja",
  noFilesFound: 'Nu sunt fișiere sau directoare aici',
  noInternetConnection: 'Fără conexiune la internet',
  noMoreFilesAllowed: 'Nu se pot adăuga fișiere noi: încărcare în curs',
  openFolderNamed: 'Deschide director %{name}',
  pause: 'Întrerupe',
  pauseUpload: 'Întrerupe încărcarea',
  paused: 'Întrerupt',
  poweredBy: 'Susținut de %{uppy}',
  processingXFiles: {
    '0': 'Se procesează %{smart_count} fișier',
    '1': 'Se procesează %{smart_count} fișiere',
  },
  recordingLength: 'Durată înregistrare %{recording_length}',
  recordingStoppedMaxSize:
    'Înregistrarea a fost oprită pentru că a depășit dimensiunea maximă permisă',
  removeFile: 'Elimină fișier',
  resetFilter: 'Resetează filtre',
  resume: 'Reia',
  resumeUpload: 'Reia încărcarea',
  retry: 'Reîncercare',
  retryUpload: 'Reîncearcă încărcarea',
  saveChanges: 'Salvează modificări',
  selectFileNamed: 'Selectează fișier %{name}',
  selectX: {
    '0': 'Selectează %{smart_count}',
    '1': 'Selectează %{smart_count}',
  },
  smile: 'Zâmbește!',
  startRecording: 'Pornește înregistrarea video',
  stopRecording: 'Oprește înregistrarea video',
  takePicture: 'Fă o poză',
  timedOut: 'Încărcarea blocată pentru %{seconds} secunde, se anulează.',
  unselectFileNamed: 'Deselectează fișier %{name}',
  upload: 'Încarcă',
  uploadComplete: 'Încărcare finalizată',
  uploadFailed: 'Probleme la încărcare',
  uploadPaused: 'Încărcare întreruptă',
  uploadXFiles: {
    '0': 'Încarcă %{smart_count} fișier',
    '1': 'Încarcă %{smart_count} fișiere',
  },
  uploadXNewFiles: {
    '0': 'Încarcă +%{smart_count} fișier',
    '1': 'Încarcă +%{smart_count} fișiere',
  },
  uploading: 'Încărcare',
  uploadingXFiles: {
    '0': 'Se încarcă %{smart_count} fișier',
    '1': 'Se încarcă %{smart_count} fișiere',
  },
  xFilesSelected: {
    '0': '%{smart_count} fișier selectat',
    '1': '%{smart_count} fișiere selectate',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} fișier adăugat',
    '1': '%{smart_count} fișiere adăugate',
  },
  xTimeLeft: '%{time} rămas(e)',
  youCanOnlyUploadFileTypes: 'Poți încărca doar: %{types}',
  youCanOnlyUploadX: {
    '0': 'Poți încărca doar %{smart_count} fișier',
    '1': 'Poți încărca doar %{smart_count} fișiere',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Selectează cel puțin %{smart_count} fișier',
    '1': 'Selectează cel puțin %{smart_count} fișiere',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ro_RO = ro_RO
}

export default ro_RO
