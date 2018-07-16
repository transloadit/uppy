/* eslint camelcase: 0 */

const cs_CZ = {}

cs_CZ.strings = {
  chooseFile: 'Vyberte soubor',
  orDragDrop: 'nebo ho sem přetáhněte',
  youHaveChosen: 'Vybrali jste: %{fileName}',
  filesChosen: {
    0: '%{smart_count} soubor vybrán',
    1: '%{smart_count} soubory vybrány',
    2: '%{smart_count} souborů vybráno'
  },
  filesUploaded: {
    0: '%{smart_count} soubor nahrán',
    1: '%{smart_count} soubory nahrány',
    2: '%{smart_count} souborů nahráno'
  },
  files: {
    0: '%{smart_count} soubor',
    1: '%{smart_count} soubory',
    2: '%{smart_count} souborů'
  },
  uploadFiles: {
    0: 'Nahrát %{smart_count} soubor',
    1: 'Nahrát %{smart_count} soubory',
    2: 'Nahrát %{smart_count} souborů'
  },
  selectToUpload: 'Vybrat soubory k nahrání',
  closeModal: 'Zavřít okno',
  upload: 'Nahrát',
  importFrom: 'Importovat soubory z',
  dashboardWindowTitle: 'Uppy Dashboard okno (Pro zavření stiskněte Escape)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Odkaz zkopírován do schránky.',
  copyLinkToClipboardFallback: 'Zkopírovat následující odkaz',
  done: 'Hotovo',
  localDisk: 'Disk',
  dropPasteImport: 'Přetáhněte soubory, vložte je, importujte je z některých výše uvedených služeb, nebo',
  dropPaste: 'Přetáhněte soubory, vložte je, nebo',
  browse: 'procházejte',
  fileProgress: 'Nahrávání: rychlost nahrávání a zbývající čas',
  numberOfSelectedFiles: 'Počet vybraných souborů',
  uploadAllNewFiles: 'Nahrát všechny nové soubory'
}

cs_CZ.pluralize = function (n) {
  if (n === 1) {
    return 0
  }

  if (n >= 2 && n <= 4) {
    return 1
  }

  return 2
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.cs_CZ = cs_CZ
}

module.exports = cs_CZ
