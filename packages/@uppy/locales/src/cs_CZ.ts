import type { Locale } from '@uppy/utils/lib/Translator'

const cs_CZ: Locale<0 | 1 | 2> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    if (n > 1 && n < 5) {
      return 1
    }
    return 2
  },
}

cs_CZ.strings = {
  addMore: 'Přidat další',
  addMoreFiles: 'Přidat další soubory',
  addingMoreFiles: 'Přidávání dalších souborů',
  allowAccessDescription:
    'Pokud chcete pořizovat fotografie vaším zařízením, povolte prosím přístup ke kameře.',
  allowAccessTitle: 'Povolte prosím přístup ke kameře.',
  authenticateWith: 'Připojit k %{pluginName}',
  authenticateWithTitle:
    'Prosím přihlaste se k %{pluginName} pro výběr souborů',
  back: 'Zpět',
  browse: 'procházet',
  browseFiles: 'procházet',
  cancel: 'Zrušit',
  cancelUpload: 'Zrušit nahrávání',
  chooseFiles: 'Vyberte soubory',
  closeModal: 'Zavřít dialog',
  companionError: 'Spojení s modulem Companion se nezdařilo',
  complete: 'Hotovo',
  connectedToInternet: 'Připojeno k internetu',
  copyLink: 'Zkopírovat odkaz',
  copyLinkToClipboardFallback: 'Zkopírujte odkaz níže',
  copyLinkToClipboardSuccess: 'Odkaz zkopírován do schránky',
  creatingAssembly: 'Nahrávání se připravuje...',
  creatingAssemblyFailed: 'Transloadit: Nelze vytvořit Assembly',
  dashboardTitle: 'Nahrát soubory',
  dashboardWindowTitle:
    'Okno pro nahrání souborů. (Stiskněte ESC pro zavření.)',
  dataUploadedOfTotal: '%{complete} z %{total}',
  done: 'Dokončeno',
  dropHereOr: 'Přetáhněte soubory sem nebo %{browse}',
  dropHint: 'Přetáhněte soubory sem',
  dropPasteBoth: 'Přetáhněte soubory sem, vložte je, nebo %{browse}',
  dropPasteFiles: 'Přetáhněte soubory sem, vložte je, nebo %{browse}',
  dropPasteFolders: 'Přetáhněte soubory sem, vložte je, nebo %{browse}',
  dropPasteImportBoth:
    'Přetáhněte soubory sem, vložte je, %{browse} nebo je importujte',
  dropPasteImportFiles:
    'Přetáhněte soubory sem, vložte je, %{browse} nebo je importujte',
  dropPasteImportFolders:
    'Přetáhněte soubory sem, vložte je, %{browse} nebo je importujte',
  editFile: 'Upravit soubor',
  editImage: 'Upravit obrázek',
  editing: 'Upravujete %{file}',
  emptyFolderAdded: 'Nebyly přidány žádné soubory, adresář je prázdný.',
  encoding: 'Převádění...',
  enterCorrectUrl:
    'Chybná URL: Ujistěte se, že vkládáte přímý odkaz na soubor.',
  enterUrlToImport: 'Vložte URL pro import souboru.',
  exceedsSize: 'Tento soubor překračuje maximální povolenou velikost: %{size}',
  failedToFetch:
    'Modulu Companion se nepodařilo stáhnout soubor z této URL, zkontrolujte prosím, jestli je URL správná.',
  failedToUpload: 'Nepodařilo se nahrát soubor %{file}',
  fileSource: 'Zdroj souboru: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} z %{smart_count} souboru nahráno',
    '1': '%{complete} z %{smart_count} souborů nahráno',
    '2': '%{complete} z %{smart_count} souborů nahráno',
  },
  filter: 'Filtrovat',
  finishEditingFile: 'Dokončit editaci souboru',
  folderAdded: {
    '0': 'Přidán %{smart_count} soubor z adresáře %{folder}',
    '1': 'Přidány %{smart_count} soubory z adresáře %{folder}',
    '2': 'Přidáno %{smart_count} souborů z adresáře %{folder}',
  },
  generatingThumbnails: 'Vytváří se miniatury...',
  import: 'Importovat',
  importFrom: 'Importovat z %{name}',
  loading: 'Nahrávání...',
  logOut: 'Odhlásit',
  myDevice: 'Moje zařízení',
  noDuplicates: "Nelze znovu přidat stejný soubor '%{fileName}'",
  noFilesFound: 'Nenalezeny žádné soubory ani adresáře',
  noInternetConnection: 'Nepřipojeno k internetu',
  openFolderNamed: 'Otevřít adresář %{name}',
  pause: 'Pozastavit',
  pauseUpload: 'Pozastavit nahrávání',
  paused: 'Pozastaveno',
  poweredBy: 'Vytvořeno pomocí %{uppy}',
  processingXFiles: {
    '0': 'Zpracování %{smart_count} souboru',
    '1': 'Zpracování %{smart_count} souborů',
    '2': 'Zpracování %{smart_count} souborů',
  },
  removeFile: 'Odebrat soubor',
  resetFilter: 'Reset filtru',
  resume: 'Pokřačovat',
  resumeUpload: 'Pokračovat v nahrávání',
  retry: 'Opakovat',
  retryUpload: 'Opakovat nahrávání',
  save: 'Uložit',
  saveChanges: 'Uložit změny',
  selectFileNamed: 'Vybrat soubor %{name}',
  selectX: {
    '0': 'Vybrat %{smart_count}',
    '1': 'Vybrat %{smart_count}',
    '2': 'Vybrat %{smart_count}',
  },
  smile: 'Úsměv prosím!',
  startRecording: 'Spustit nahrávání videa',
  stopRecording: 'Zastavit nahrávání videa',
  takePicture: 'Pořídit fotografii',
  timedOut:
    'Stav nahrávání se nezměnil %{seconds} sekund, nahrávání se ukončuje.',
  unselectFileNamed: 'Zrušit výběr souboru %{name}',
  upload: 'Nahrát',
  uploadComplete: 'Nahrání dokončeno',
  uploadFailed: 'Nahrání se nezdařilo',
  uploadPaused: 'Nahrání dokončeno',
  uploadXFiles: {
    '0': 'Nahrát %{smart_count} soubor',
    '1': 'Nahrát %{smart_count} soubory',
    '2': 'Nahrát %{smart_count} souborů',
  },
  uploadXNewFiles: {
    '0': 'Nahrát +%{smart_count} soubor',
    '1': 'Nahrát +%{smart_count} soubory',
    '2': 'Nahrát +%{smart_count} souborů',
  },
  uploading: 'Nahrávání',
  uploadingXFiles: {
    '0': 'Nahrávání %{smart_count} souboru',
    '1': 'Nahrávání %{smart_count} souborů',
    '2': 'Nahrávání %{smart_count} souborů',
  },
  xFilesSelected: {
    '0': '%{smart_count} soubor vybrán',
    '1': '%{smart_count} soubory vybrány',
    '2': '%{smart_count} souborů vybráno',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} další soubor přidán',
    '1': '%{smart_count} další soubory přidány',
    '2': '%{smart_count} dalších souborů přidáno',
  },
  xTimeLeft: '%{time} zbývá',
  youCanOnlyUploadFileTypes:
    'Lze nahrát pouze následující typy souborů: %{types}',
  youCanOnlyUploadX: {
    '0': 'Lze nahrát pouze %{smart_count} soubor',
    '1': 'Lze nahrát pouze %{smart_count} soubory',
    '2': 'Lze nahrát pouze %{smart_count} souborů',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Je třeba vybrat alespoň %{smart_count} soubor',
    '1': 'Je třeba vybrat alespoň %{smart_count} soubory',
    '2': 'Je třeba vybrat alespoň %{smart_count} souborů',
  },
}

export default cs_CZ
