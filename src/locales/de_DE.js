/* eslint camelcase: 0 */

const de_DE = {}

de_DE.strings = {
  chooseFile: 'Wähle eine Datei',
  youHaveChosen: 'Du hast gewählt: %{fileName}',
  orDragDrop: 'oder schiebe Sie hier her',
  filesChosen: {
    0: '%{smart_count} Datei gewählt',
    1: '%{smart_count} Dateien gewählt'
  },
  filesUploaded: {
    0: '%{smart_count} Datei hochgeladen',
    1: '%{smart_count} Dateien hochgeladen'
  },
  files: {
    0: '%{smart_count} Datei',
    1: '%{smart_count} Dateien'
  },
  uploadFiles: {
    0: 'Upload %{smart_count} Datei',
    1: 'Upload %{smart_count} Dateien'
  },
  selectToUpload: 'Ausgewählten Dateien wurden hochgeladen',
  closeModal: 'Schließen Modal',
  upload: 'Hochladen',
  importFrom: 'Importiere Daten von',
  dashboardWindowTitle: 'Uppy Dashboard Fenster (Drücke Escape zum schließen)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Link wurde in Zwischenablage kopiert.',
  copyLinkToClipboardFallback: 'Kopiere die untere URL',
  done: 'Fertig',
  localDisk: 'Lokale Festplatte',
  dropPasteImport: 'Ziehe Dateien hier her, einfügen, importieren aus einer der oberen Quellen oder',
  dropPaste: 'Zihe Dateien hier her, einfügen oder',
  browse: 'Durchsuchen',
  fileProgress: 'Datei Fortschritt: Upload Geschwindigkeit und ETA',
  numberOfSelectedFiles: 'Anzahl gewählter Dateien',
  uploadAllNewFiles: 'Alle neuen Dateien hochladen'
}

de_DE.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.de_DE = de_DE
}

module.exports = de_DE