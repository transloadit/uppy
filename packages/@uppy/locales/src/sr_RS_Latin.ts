import type { Locale } from '@uppy/utils'

const sr_RS_Latin: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

sr_RS_Latin.strings = {
  addMore: 'Dodaj još',
  addMoreFiles: 'Dodaj još datoteka',
  addingMoreFiles: 'Dodavanje datoteka',
  allowAccessDescription:
    'Molimo Vas, dozvolite pristup Vašoj kameri, kako biste mogli da je koristite za snimanje fotografija i video zapisa.',
  allowAccessTitle: 'Molimo Vas, dozvolite pristup Vašoj kameri',
  authenticateWith: 'Poveži se putem %{pluginName}',
  authenticateWithTitle:
    'Molimo Vas da se prijavite putem %{pluginName} kako biste preuzeli datoteke',
  back: 'Nazad',
  browse: 'potraži',
  browseFiles: 'potraži',
  cancel: 'Otkaži',
  cancelUpload: 'Otkaži otpremanje',
  closeModal: 'Zatvori',
  companionError: 'Neuspelo povezivanje sa Companion',
  complete: 'Otpremljeno',
  connectedToInternet: 'Povezan na internet',
  copyLink: 'Sastavi link',
  copyLinkToClipboardFallback: 'Kopiraj (sačuvaj) donji URL',
  copyLinkToClipboardSuccess: 'Link je kopiran u klipbord',
  creatingAssembly: 'Pripremanje otpremanja...',
  creatingAssemblyFailed: 'Transloadit: ne mogu da napravim Assembly',
  dashboardTitle: 'Otpremanje datoteka',
  dashboardWindowTitle:
    'Prozor za otpremanje datoteka (pritirnite ESC za izlaz)',
  dataUploadedOfTotal: '%{complete} od %{total}',
  done: 'Završeno',
  dropHint: 'Spusti datoteke ovde',
  dropPasteBoth: 'Spusti datoteke ovde, umetni ili %{browse}',
  dropPasteFiles: 'Spusti datoteke ovde, umetni ili %{browse}',
  dropPasteFolders: 'Spusti datoteke ovde, umetni ili %{browse}',
  dropPasteImportBoth:
    'Spusti datoteke ovde, umetni (eng. "paste"), %{browse} ili preuzmi sa',
  dropPasteImportFiles:
    'Spusti datoteke ovde, umetni (eng. "paste"), %{browse} ili preuzmi sa',
  dropPasteImportFolders:
    'Spusti datoteke ovde, umetni (eng. "paste"), %{browse} ili preuzmi sa',
  editFile: 'Izmeni datoteku',
  editImage: 'Uredi sliku',
  editing: 'Menjanje %{file}',
  emptyFolderAdded: 'Ni jedna datoteka nije dodata iz praznog foldera',
  encoding: 'Šifrovanje...',
  enterCorrectUrl: 'Pogrešan URL: unesite tačnu putanju do datoteke',
  enterUrlToImport: 'Unesite URL (putanju) do datoteke',
  exceedsSize: 'Ova datoteka premašuje najveću dozvoljenu veličinu od %{size}',
  failedToFetch:
    'Companion nije uspeo da dopre do date adrese (URL), proverite ispravnost adrese',
  failedToUpload: 'Broj neuspelo otpremljenih datoteka: %{file}',
  fileSource: 'Datoteka: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete}. Ukupno otremljenih datoteka: %{smart_count}',
    '1': '%{complete}. Ukupno otremljenih datoteka: %{smart_count}',
  },
  filter: 'Filter',
  finishEditingFile: 'Završi menjanje fajla',
  folderAdded: {
    '0': 'Broj datoteka preuzetih iz %{folder}: %{smart_count}',
    '1': 'Broj datoteka preuzetih iz %{folder}: %{smart_count}',
  },
  import: 'Preuzmi',
  importFrom: 'Preuzmi sa %{name}',
  loading: 'Učitavam...',
  logOut: 'Odjava',
  myDevice: 'Moj računar ili mobilni uređaj',
  noFilesFound: 'Ovde nema foldera ili datoteka',
  noInternetConnection: 'Nema veze sa internetom',
  pause: 'Zaustavi privremeno',
  pauseUpload: 'Privremeno zaustavi otpremanje',
  paused: 'Privremeno zaustavljeno',
  poweredBy: 'Otpremanje pokreće %{uppy}',
  processingXFiles: {
    '0': 'Obrada datoteke',
    '1': 'Broj datoteka koje se obrađuju: %{smart_count}',
  },
  removeFile: 'Ukloni dadoteku',
  resetFilter: 'Izbriši filter',
  resume: 'Nastavi',
  resumeUpload: 'Nastavi otpremanje',
  retry: 'Pokušaj ponovo',
  retryUpload: 'Pokušaj ponovo da otpremiš',
  saveChanges: 'Sačuvaj izmene',
  selectX: {
    '0': 'Izaberi datoteku',
    '1': 'Izaberi %{smart_count}',
  },
  smile: 'Osmeh!',
  startRecording: 'Započni snimanje video zapisa',
  stopRecording: 'Zaustavi snimanje video zapisa',
  takePicture: 'Snimi fotografiju',
  timedOut:
    'Prekidamo otpremanje jer je zastalo. Broj sekundi zastoja: %{seconds}.',
  upload: 'Otpremi',
  uploadComplete: 'Otpremanje je završeno u celosti',
  uploadFailed: 'Otpremanje nije uspelo',
  uploadPaused: 'Otpremanje je privremeno zaustavljeno',
  uploadXFiles: {
    '0': 'Otpremi datoteku',
    '1': 'Otpremi datoteke. Ukupno: %{smart_count}',
  },
  uploadXNewFiles: {
    '0': 'Otpremi +%{smart_count} datoteku',
    '1': 'Otpremi datoteke. Ukupno: +%{smart_count}',
  },
  uploading: 'Otpremanje',
  uploadingXFiles: {
    '0': 'Broj datoteka koje se trenutno otpremaju: %{smart_count}',
    '1': 'Broj datoteka koje se trenutno otpremaju: %{smart_count}',
  },
  xFilesSelected: {
    '0': 'Broj datoteka za otpremanje: %{smart_count}',
    '1': 'Broj datoteka za otpremanje: %{smart_count}',
  },
  xMoreFilesAdded: {
    '0': 'Broj dodatih datoteka: %{smart_count}',
    '1': 'Broj dodatih datoteka: %{smart_count}',
  },
  xTimeLeft: 'Preostalo vreme %{time} ',
  youCanOnlyUploadFileTypes: 'Možete da otpremite samo: %{types}',
  youCanOnlyUploadX: {
    '0': 'Dozvoljeni broj datoteka za otpremanje: %{smart_count}',
    '1': 'Dozvoljeni broj datoteka za otpremanje: %{smart_count}',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Izaberite bar jednu datoteku',
    '1': 'Izaberite datoteke. Najmanje: %{smart_count}',
  },
  selectFileNamed: 'Izaberite fajl %{name}',
  unselectFileNamed: 'Isključite fajl %{name}',
  openFolderNamed: 'Otvori folder %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.sr_RS_Latin = sr_RS_Latin
}

export default sr_RS_Latin
