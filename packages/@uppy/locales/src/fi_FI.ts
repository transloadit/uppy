import type { Locale } from '@uppy/utils'

const fi_FI: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

fi_FI.strings = {
  addMore: 'Lisää',
  addMoreFiles: 'Lisää tiedostoja',
  addingMoreFiles: 'Lisätään tiedostoja',
  allowAccessDescription:
    'Jotta voit lähettää kuvia tai videota kamerastasi, sinun tulee antaa tälle sivustolle oikeus käyttää kameraasi.',
  allowAccessTitle: 'Salli kameran käyttö, kiitos',
  authenticateWith: 'Mene %{pluginName}',
  authenticateWithTitle:
    '%{pluginName} vaadittu tunnistautumiseen, jotta voit valita tiedostoja',
  back: 'Takaisin',
  browse: 'selaa',
  browseFiles: 'selaa',
  cancel: 'Peruuta',
  cancelUpload: 'Peruuta lähetys',
  closeModal: 'Sulje ikkuna',
  companionError: 'Yhdistäminen Companioniin epäonnistui',
  complete: 'Valmis',
  connectedToInternet: 'Yhdistetty Internettiin',
  copyLink: 'Kopioi linkki',
  copyLinkToClipboardFallback: 'Kopioi alla oleva linkki',
  copyLinkToClipboardSuccess: 'Linkki kopioitu leikepöydälle',
  creatingAssembly: 'Valmistellaan lähetystä...',
  creatingAssemblyFailed: 'Transloadit: Assemblyn luonti epäonnistui',
  dashboardTitle: 'Tiedoston Lataaja',
  dashboardWindowTitle: 'Tiedoston latausikkuna (Paina Esc sulkeaksesi)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  done: 'Valmis',
  dropHint: 'Raahaa tiedostot tähän',
  dropPasteBoth: 'Raahaa tiedostot tähän, liitä tai %{browse}',
  dropPasteFiles: 'Raahaa tiedostot tähän, liitä tai %{browse}',
  dropPasteFolders: 'Raahaa tiedostot tähän, liitä tai %{browse}',
  dropPasteImportBoth: 'Raahaa tiedostot tähän, liitä, %{browse} tai tuo',
  dropPasteImportFiles: 'Raahaa tiedostot tähän, liitä, %{browse} tai tuo',
  dropPasteImportFolders: 'Raahaa tiedostot tähän, liitä, %{browse} tai tuo',
  editFile: 'Muokkaa tiedostoa',
  editImage: 'Muokkaa kuvaa',
  editing: 'Muokataan %{file}',
  emptyFolderAdded: 'Ei lisätty tiedostoja tyhjästä kansiosta',
  encoding: 'Koodataan...',
  enterCorrectUrl:
    'Epäkelpo osoite: Varmista, että osoite osoittaa suoraan tiedostoon',
  enterUrlToImport: 'Anna osoite tuodaksesi tiedoston',
  exceedsSize: 'Tiedoston koko ylittää sallitun maksimin %{size}',
  failedToFetch:
    'Companion ei voinut ladata tiedostoa osoitteesta, onko osoite varmasti oikea?',
  failedToUpload: 'Ei voitu lähettää tiedostoa %{file}',
  fileSource: 'Tiedoston lähde: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} / %{smart_count} tiedostosta lähetetty',
    '1': '%{complete} / %{smart_count} tiedostoa lähetetty',
  },
  filter: 'Suodata',
  finishEditingFile: 'Lopeta tiedoston muokkaus',
  folderAdded: {
    '0': 'Lisätty %{smart_count} tiedosto kansiosta %{folder}',
    '1': 'Lisätty %{smart_count} tiedostoa kansiosta %{folder}',
  },
  import: 'Tuo',
  importFrom: 'Tuo %{name}',
  loading: 'Ladataan...',
  logOut: 'Kirjaudu ulos',
  myDevice: 'Laitteeltani',
  noFilesFound: 'Sinulla ei ole tiedostoja tai kansioita täällä',
  noInternetConnection: 'Ei Internet-yhteyttä',
  openFolderNamed: 'Avaa kansio %{name}',
  pause: 'Keskeytä',
  pauseUpload: 'Keskeytä lähetys',
  paused: 'Keskeytetty',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': 'Käsitellään %{smart_count} tiedostoa',
    '1': 'Käsitellään %{smart_count} tiedostoa',
  },
  removeFile: 'Poista tiedosto',
  resetFilter: 'Resetoi suodatin',
  resume: 'Jatka',
  resumeUpload: 'Jatka lähetystä',
  retry: 'Yritä uudelleen',
  retryUpload: 'Yritä lähetystä uudelleen',
  saveChanges: 'Tallenna muutokset',
  selectFileNamed: 'Valitse tiedosto %{name}',
  selectX: {
    '0': 'Valitse %{smart_count}',
    '1': 'Valitse %{smart_count}',
  },
  smile: 'Hymyile!',
  startRecording: 'Aloita videon tallennus',
  stopRecording: 'Lopeta videon tallennus',
  takePicture: 'Ota kuva',
  timedOut: 'Lähetys jumittunut %{seconds} sekunniksi, keskeytetään.',
  unselectFileNamed: 'Poista valinta tiedostosta %{name}',
  upload: 'Lähetä',
  uploadComplete: 'Lähetys valmis',
  uploadFailed: 'Lähetys epäonnistui',
  uploadPaused: 'Lähetys keskeytetty',
  uploadXFiles: {
    '0': 'Lähetä %{smart_count} tiedosto',
    '1': 'Lähetä %{smart_count} tiedostoa',
  },
  uploadXNewFiles: {
    '0': 'Lähetä +%{smart_count} tiedosto',
    '1': 'Lähetä +%{smart_count} tiedostoa',
  },
  uploading: 'Lähetetään',
  uploadingXFiles: {
    '0': 'Lähetetään %{smart_count} tiedosto',
    '1': 'Lähetetään %{smart_count} tiedostoa',
  },
  xFilesSelected: {
    '0': '%{smart_count} tiedosto valittu',
    '1': '%{smart_count} tiedostoa valittu',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} tiedosto added',
    '1': '%{smart_count} tiedostoa added',
  },
  xTimeLeft: '%{time} jäljellä',
  youCanOnlyUploadFileTypes: 'Sallitut tiedostomuodot: %{types}',
  youCanOnlyUploadX: {
    '0': 'Voit lähettää vain %{smart_count} tiedosto',
    '1': 'Voit lähettää vain %{smart_count} tiedostoa',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Sinun pitää valita vähintään %{smart_count} tiedosto',
    '1': 'Sinun pitää valita vähintään %{smart_count} tiedostoa',
  },
  startCapturing: 'Aloita tallennus',
  stopCapturing: 'Lopeta tallennus',
  submitRecordedFile: 'Hyväksy tallenne',
  streamActive: 'Jako aktiivinen',
  streamPassive: 'Jako passiivinen',
  micDisabled: 'Käyttäjä on estänyt mikrofonin',
  recording: 'Tallennetaan',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.fi_FI = fi_FI
}

export default fi_FI
