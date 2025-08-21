import type { Locale } from '@uppy/utils'

const hr_HR: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

hr_HR.strings = {
  addMore: 'Dodaj još',
  addMoreFiles: 'Dodaj još datoteka',
  addingMoreFiles: 'Dodavanje datoteka',
  allowAccessDescription:
    'Molimo Vas, dozvolite pristup Vašoj kameri kako biste je mogli koristiti za snimanje fotografija i video zapisa.',
  allowAccessTitle: 'Molimo Vas dozvolite pristup Vašoj kameri',
  authenticateWith: 'Poveži se putem %{pluginName}',
  authenticateWithTitle:
    'Molimo Vas da se prijavite putem %{pluginName} kako biste preuzeli datoteke',
  back: 'Natrag',
  browse: 'pretraži',
  browseFiles: 'pretraži',
  cancel: 'Otkaži',
  cancelUpload: 'Otkaži prijenos',
  closeModal: 'Zatvori',
  companionError: 'Neuspješno povezivanje s Companion-om',
  complete: 'Prijenos uspješan',
  connectedToInternet: 'Povezan s internetom',
  copyLink: 'Kopiraj link',
  copyLinkToClipboardFallback: 'Kopiraj donji URL',
  copyLinkToClipboardSuccess: 'Link je kopiran u međuspremnik',
  creatingAssembly: 'Pripremanje prijenosa...',
  creatingAssemblyFailed: 'Transloadit: nemoguće kreirati Assembly',
  dashboardTitle: 'Prijenos datoteka',
  dashboardWindowTitle: 'Prozor za prijenos datoteka (pritisnite ESC za izlaz)',
  dataUploadedOfTotal: '%{complete} od %{total}',
  done: 'Završeno',
  dropHint: 'Ispusti datoteke ovdje',
  dropPasteBoth: 'Ispusti datoteke ovdje, zalijepi ili %{browse}',
  dropPasteFiles: 'Ispusti datoteke ovdje, zalijepi ili %{browse}',
  dropPasteFolders: 'Ispusti datoteke ovdje, zalijepi ili %{browse}',
  dropPasteImportBoth:
    'Ispusti datoteke ovdje, zalijepi (eng. "paste"), %{browse} ili preuzmi s',
  dropPasteImportFiles:
    'Ispusti datoteke ovdje, zalijepi (eng. "paste"), %{browse} ili preuzmi s',
  dropPasteImportFolders:
    'Ispusti datoteke ovdje, zalijepi (eng. "paste"), %{browse} ili preuzmi s',
  editFile: 'Izmijeni datoteku',
  editImage: 'Uredi sliku',
  editing: 'Uredi %{file}',
  emptyFolderAdded: 'Ni jedna datoteka nije dodana iz prazne mape',
  encoding: 'Enkodiranje...',
  enterCorrectUrl: 'Pogrešan URL: unesite točnu putanju do datoteke',
  enterUrlToImport: 'Unesite URL do datoteke',
  exceedsSize: 'Ova datoteka premašuje najveću dozvoljenu veličinu od %{size}',
  failedToFetch:
    'Companion nije uspio dohvatiti traženi URL, provjerite ispravnost adrese',
  failedToUpload: 'Broj neuspješno prenesenih datoteka: %{file}',
  fileSource: 'Datoteka: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete}. Ukupno prenesenih datoteka: %{smart_count}',
    '1': '%{complete}. Ukupno prenesenih datoteka: %{smart_count}',
  },
  filter: 'Filtriraj',
  finishEditingFile: 'Završi uređivanje datoteke',
  folderAdded: {
    '0': 'Broj datoteka preuzetih iz %{folder}: %{smart_count}',
    '1': 'Broj datoteka preuzetih iz %{folder}: %{smart_count}',
  },
  import: 'Preuzmi',
  importFrom: 'Preuzmi s %{name}',
  loading: 'Učitavam...',
  logOut: 'Odjava',
  myDevice: 'Moj uređaj',
  noFilesFound: 'Ovdje nema mapa ili datoteka',
  noInternetConnection: 'Nemoguće uspostaviti vezu s internetom',
  pause: 'Zaustavi privremeno',
  pauseUpload: 'Privremeno zaustavi prijenos',
  paused: 'Privremeno zaustavljeno',
  poweredBy: 'Podržano od strane %{uppy}',
  processingXFiles: {
    '0': 'Obrada datoteke',
    '1': 'Broj datoteka koje se obrađuju: %{smart_count}',
  },
  removeFile: 'Ukloni datoteku',
  resetFilter: 'Izbriši filter',
  resume: 'Nastavi',
  resumeUpload: 'Nastavi prijenos',
  retry: 'Pokušaj ponovo',
  retryUpload: 'Ponovno pokušaj prenijeti datoteku',
  save: 'Spremi',
  saveChanges: 'Spremi promjene',
  selectX: {
    '0': 'Izaberi datoteku',
    '1': 'Izaberi %{smart_count}',
  },
  smile: 'Osmijeh!',
  startRecording: 'Započni snimanje video zapisa',
  stopRecording: 'Zaustavi snimanje video zapisa',
  takePicture: 'Snimi fotografiju',
  timedOut:
    'Prekidamo prijenos radi poteškoća. Broj sekundi zastoja: %{seconds}.',
  upload: 'Prenesi',
  uploadComplete: 'Prijenos uspio',
  uploadFailed: 'Prijenos nije uspio',
  uploadPaused: 'Prijenos je privremeno zaustavljen',
  uploadXFiles: {
    '0': 'Prenesi datoteku',
    '1': 'Prenesi datoteke. Ukupno: %{smart_count}',
  },
  uploadXNewFiles: {
    '0': 'Prenesi +%{smart_count} datoteku',
    '1': 'Prenesi datoteke. Ukupno: +%{smart_count}',
  },
  uploading: 'Datoteka se prenosi',
  uploadingXFiles: {
    '0': 'Broj datoteka koje se trenutno prenose: %{smart_count}',
    '1': 'Broj datoteka koje se trenutno prenose: %{smart_count}',
  },
  xFilesSelected: {
    '0': 'Broj datoteka za prijenos: %{smart_count}',
    '1': 'Broj datoteka za prijenos: %{smart_count}',
  },
  xMoreFilesAdded: {
    '0': 'Broj dodatih datoteka: %{smart_count}',
    '1': 'Broj dodatih datoteka: %{smart_count}',
  },
  xTimeLeft: 'Preostalo vrijeme %{time} ',
  youCanOnlyUploadFileTypes: 'Moguće je prenijeti samo: %{types}',
  youCanOnlyUploadX: {
    '0': 'Dozvoljeni broj datoteka za prijenos: %{smart_count}',
    '1': 'Dozvoljeni broj datoteka za prijenos: %{smart_count}',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Izaberite bar jednu datoteku',
    '1': 'Izaberite datoteke. Najmanje: %{smart_count}',
  },
  selectFileNamed: 'Izaberite datoteku %{name}',
  unselectFileNamed: 'Isključite datoteku %{name}',
  openFolderNamed: 'Otvori mapu %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.hr_HR = hr_HR
}

export default hr_HR
