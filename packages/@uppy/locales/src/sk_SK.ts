import type { Locale } from '@uppy/utils'

const sk_SK: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

sk_SK.strings = {
  addBulkFilesFailed: {
    '0': 'Súbor %{smart_count} sa nepodarilo pridať z dôvodu vnútornej chyby',
    '1': 'Nepodarilo sa pridať %{smart_count} súbory z dôvodu vnútorných chýb',
  },
  addMore: 'Pridať ďalšie',
  addMoreFiles: 'Pridať ďalšie súbory',
  addingMoreFiles: 'Pridávajú sa ďalšie súbory',
  allowAccessDescription:
    'Pokiaľ chcete urobiť fotografiu alebo nahrať video vaším zariadením, povoľte prosím prístup ku kamere.',
  allowAccessTitle: 'Povoľte prístup ku kamere',
  aspectRatioLandscape: 'Orezať na šírku (16:9)',
  aspectRatioPortrait: 'Orezať na výšku (9:16)',
  aspectRatioSquare: 'Orezať do štvorca',
  authenticateWith: 'Pripojiť k %{pluginName}',
  authenticateWithTitle:
    'Prosím príhláste sa k %{pluginName} pre výber súborov',
  back: 'Späť',
  backToSearch: 'Späť na vyhľadávanie',
  browse: 'vyberte',
  browseFiles: 'vyberte',
  cancel: 'Zrušiť',
  cancelUpload: 'Zrušiť nahrávanie',
  closeModal: 'Zavrieť okno',
  companionError: 'Spojenie s modulom Companion sa nepodarilo',
  companionUnauthorizeHint:
    'Pokiaľ nechcete povoliť prístup k účtu %{provider}, prosím prejdite na túto adresu %{url}',
  complete: 'Hotovo',
  connectedToInternet: 'Pripojené k internetu',
  copyLink: 'Kopírovať odkaz',
  copyLinkToClipboardFallback: 'Skopírujte odkaz nižšie',
  copyLinkToClipboardSuccess: 'Odkaz bol skopírovaný do schránky',
  creatingAssembly: 'Pripravuje sa nahrávanie...',
  creatingAssemblyFailed: 'Transloadit: Nepodarilo sa vytvoriť Assembly',
  dashboardTitle: 'Nahrať súbory',
  dashboardWindowTitle:
    'Okno na nahrávanie súborov. (Stlačením ESC ho zavriete)',
  dataUploadedOfTotal: '%{complete} z %{total}',
  done: 'Dokončené',
  dropHint: 'Presuňte sem súbory',
  dropPasteBoth: 'Presuňte sem súbory alebo %{browse}',
  dropPasteFiles: 'Presuňte sem súbory alebo %{browse}',
  dropPasteFolders: 'Presuňte sem súbory alebo %{browse}',
  dropPasteImportBoth: 'Presuňte sem, %{browse} alebo importujte súbory:',
  dropPasteImportFiles: 'Presuňte sem, %{browse} alebo importujte súbory:',
  dropPasteImportFolders: 'Presuňte sem, %{browse} alebo importujte súbory:',
  editFile: 'Upraviť súbor',
  editImage: 'Upraviť obrázok',
  editing: 'Úprava %{file}',
  emptyFolderAdded: 'Neboli pridané žiadne súbory, pretože adresár je prázdny.',
  encoding: 'Konvertovanie...',
  enterCorrectUrl:
    'Nesprávna adresa URL: Uistite sa, že zadávate priamy odkaz na súbor',
  enterTextToSearch: 'Zadajte text pre vyhľadanie obrázkov',
  enterUrlToImport: 'Ak chcete importovať súbor, zadajte adresu URL',
  exceedsSize:
    'Tento súbor presahuje maximálnu povolenú veľkosť súboru %{size}',
  failedToFetch:
    'Nepodarilo sa načítať túto webovú adresu. Skontrolujte, či je správna',
  failedToUpload: 'Nepodarilo sa nahrať súbor %{file}',
  fileSource: 'Zdroj súboru: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} z %{smart_count} nahraných súborov',
    '1': '%{complete} z %{smart_count} nahraných súborov',
  },
  filter: 'Filtrovať',
  finishEditingFile: 'Dokončiť úpravu súborov',
  flipHorizontal: 'Otočiť horizontálne',
  folderAdded: {
    '0': 'Pridaný %{smart_count} súbor zo zložky %{folder}',
    '1': 'Pridané %{smart_count} súbory zo zložky %{folder}',
  },
  generatingThumbnails: 'Vytváram miniatury...',
  import: 'Importovať',
  importFrom: 'Import z %{name}',
  inferiorSize: 'Tento súbor je menší ako povolená veľkosť súboru %{size}',
  loading: 'Nahrávanie...',
  logOut: 'Odhlásiť',
  micDisabled: 'Užívateľ odmietol prístup k mikrofónu',
  myDevice: 'Moje zariadenie',
  noCameraDescription:
    'Ak chcete urobiť fotku alebo nahrať video, zapnite kameru',
  noCameraTitle: 'Kamera nie je k dispozícii',
  noDuplicates:
    "Nemôžete pridať duplikátny súbor '%{fileName}', ktorý už existuje",
  noFilesFound: 'Nemáte pridané žiadne súbory ani zložky',
  noInternetConnection: 'Žiadne internetové pripojenie',
  noMoreFilesAllowed: 'Počas nahrávania nemôžete pridať ďalšie súbory',
  openFolderNamed: 'Otvoriť zložku %{name}',
  pause: 'Pozastaviť',
  pauseUpload: 'Pozastaviť nahrávanie',
  paused: 'Pozastavené',
  poweredBy: 'Vytvorené pomocou %{uppy}',
  processingXFiles: {
    '0': 'Spracovanie %{smart_count} súboru',
    '1': 'Spracovanie %{smart_count} súborov',
  },
  recording: 'Nahrávanie',
  recordingLength: 'Dĺžka záznamu %{recording_length}',
  recordingStoppedMaxSize:
    'Nahrávanie sa zastavilo, pretože veľkosť súboru sa chystá prekročiť limit',
  removeFile: 'Odstrániť súbor',
  resetFilter: 'Zrušiť filter',
  resume: 'Pokračovať',
  resumeUpload: 'Pokračovať v nahrávaní',
  retry: 'Opakovať',
  retryUpload: 'Opakovať nahrávanie',
  revert: 'Vrátiť späť',
  rotate: 'Otočiť',
  save: 'Uložiť',
  saveChanges: 'Uložiť zmeny',
  searchImages: 'Vyhľadajte obrázky',
  selectFileNamed: 'Vybrať súbor %{name}',
  selectX: {
    '0': 'Vybrať %{smart_count}',
    '1': 'Vybrať %{smart_count}',
  },
  smile: 'Úsmev prosím!',
  startCapturing: 'Spustiť snímanie obrazovky',
  startRecording: 'Spustiť nahrávanie videa',
  stopCapturing: 'Zastaviť snímanie obrazovky',
  stopRecording: 'Zastaviť nahrávanie videa',
  streamActive: 'Stream je aktívny',
  streamPassive: 'Stream nieje aktívny',
  submitRecordedFile: 'Odoslať nahraté video',
  takePicture: 'Urobiť fotku',
  timedOut: 'Nahrávanie bolo prerušené na %{seconds}, prerušuje sa.',
  unselectFileNamed: 'Zrušiť výber súboru %{name}',
  upload: 'Nahrať',
  uploadComplete: 'Nahrávanie dokončené',
  uploadFailed: 'Nahrávanie sa nepodarilo',
  uploadPaused: 'Nahrávanie pozastavené',
  uploadXFiles: {
    '0': 'Nahrať %{smart_count} súbor',
    '1': 'Nahrať %{smart_count} súbory',
  },
  uploadXNewFiles: {
    '0': 'Nahrať +%{smart_count} súbor',
    '1': 'Nahrať +%{smart_count} súbory',
  },
  uploading: 'Nahrávanie',
  uploadingXFiles: {
    '0': 'Nahrávám %{smart_count} súbor',
    '1': 'Nahrávám %{smart_count} súbory',
  },
  xFilesSelected: {
    '0': '%{smart_count} vybratý súbor',
    '1': '%{smart_count} vybrané súbory',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} ďalší pridaný súbor',
    '1': '%{smart_count} ďalšie pridané súbory',
  },
  xTimeLeft: '%{time} zostáva',
  youCanOnlyUploadFileTypes: 'Môžete nahrať iba tieto typy súborov: %{types}',
  youCanOnlyUploadX: {
    '0': 'Môžete nahrať iba %{smart_count} súbor',
    '1': 'Môžete nahrať iba %{smart_count} súbory',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Musíte vybrať aspoň %{smart_count} súbor',
    '1': 'Musíte vybrať aspoň %{smart_count} súbory',
  },
  zoomIn: 'Priblížiť',
  zoomOut: 'Oddialiť',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.sk_SK = sk_SK
}

export default sk_SK
