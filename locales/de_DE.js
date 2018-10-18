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
  closeModal: 'Fenster schließen',
  upload: 'Hochladen',
  importFrom: 'Importiere Daten von',
  dashboardWindowTitle: 'Uppy Dashboard Fenster (Drücke Escape zum schließen)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Link wurde in die Zwischenablage kopiert.',
  copyLinkToClipboardFallback: 'Kopiere die untere URL',
  done: 'Fertig',
  localDisk: 'Lokale Festplatte',
  dropPasteImport: 'Ziehe Dateien hier her, einfügen, importieren aus einer der oberen Quellen oder',
  dropPaste: 'Ziehe Dateien hier her, einfügen oder',
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

/*
    TEMP BUFFER TILL PR MERGED
    Here all german strings for Dashboard(Modal) and StatusBar
    
    strings: {
      // When `inline: false`, used as the screen reader label for the button that closes the modal.
      closeModal: 'Fenster schließen',
      // Used as the header for import panels, e.g., "Import from Google Drive".
      importFrom: 'Von %{name} importieren',
      // When `inline: false`, used as the screen reader label for the dashboard modal.
      dashboardWindowTitle: 'Uppy Dashboard Fenster (ESC zum schließen)',
      // When `inline: true`, used as the screen reader label for the dashboard area.
      dashboardTitle: 'Uppy Dashboard',
      // Shown in the Informer when a link to a file was copied to the clipboard.
      copyLinkToClipboardSuccess: 'Link in Zwischenablage kopiert.',
      // Used when a link cannot be copied automatically — the user has to select the text from the
      // input element below this string.
      copyLinkToClipboardFallback: 'Kopiere den Link unten',
      // Used as the hover title and screen reader label for buttons that copy a file link.
      copyLink: 'Link kopieren',
      // Used as the hover title and screen reader label for file source icons, e.g., "File source: Dropbox".
      fileSource: 'Quelle: %{name}',
      // Used as the label for buttons that accept and close panels (remote providers or metadata editor)
      done: 'Fertig',
      // Used as the screen reader label for buttons that remove a file.
      removeFile: 'Datei entfernen',
      // Used as the screen reader label for buttons that open the metadata editor panel for a file.
      editFile: 'Datei bearbeiten',
      // Shown in the panel header for the metadata editor. Rendered as "Editing image.png".
      editing: '%{file} wird bearbeitet',
      // Text for a button shown on the file preview, used to edit file metadata
      edit: 'Bearbeiten',
      // Used as the screen reader label for the button that saves metadata edits and returns to the
      // file list view.
      finishEditingFile: 'Bearbeiten abschließen',
      // Used as the label for the tab button that opens the system file selection dialog.
      myDevice: 'Mein Gerät',
      // Shown in the main dashboard area when no files have been selected, and one or more
      // remote provider plugins are in use. %{browse} is replaced with a link that opens the system
      // file selection dialog.
      dropPasteImport:
        'Ziehe Dateien hierhin, füge sie ein, %{browse} oder importiere sie aus',
      // Shown in the main dashboard area when no files have been selected, and no provider
      // plugins are in use. %{browse} is replaced with a link that opens the system
      // file selection dialog.
      dropPaste: 'Ziehe Dateien hierhin, füge sie ein oder %{browse}',
      // This string is clickable and opens the system file selection dialog.
      browse: 'durchsuche',
      // Used as the hover text and screen reader label for file progress indicators when
      // they have been fully uploaded.
      uploadComplete: 'Hochladen fertig',
      // Used as the hover text and screen reader label for the buttons to resume paused uploads.
      resumeUpload: 'Hochladen fortsetzen',
      // Used as the hover text and screen reader label for the buttons to pause uploads.
      pauseUpload: 'Hochladen pausieren',
      // Used as the hover text and screen reader label for the buttons to retry failed uploads.
      retryUpload: 'Hochladen erneut versuchen',

      // Used in a title, how many files are currently selected
      xFilesSelected: {
        0: '%{smart_count} Datei ausgewählt',
        1: '%{smart_count} Dateien ausgewählt'
      },

      // @uppy/status-bar strings:
      // Shown in the status bar while files are being uploaded.
      uploading: 'Lädt hoch',
      // Shown in the status bar once all files have been uploaded.
      complete: 'Fertig',
      // Shown in the status bar if an upload failed.
      uploadFailed: 'Hochladen fehlgeschlagen',
      // Shown next to `uploadFailed`.
      pleasePressRetry: 'Bitte klicke Erneut versuchen um es noch einmal zu versuchen',
      // Shown in the status bar while the upload is paused.
      paused: 'Pausiert',
      error: 'Fehler',
      // Used as the label for the button that retries an upload.
      retry: 'Erneut versuchen',
      // Used as the label for the button that cancels an upload.
      cancel: 'Abbrechen',
      // Used as the screen reader label for the button that retries an upload.
      retryUpload: 'Hochladen erneut versuchen',
      // Used as the screen reader label for the button that pauses an upload.
      pauseUpload: 'Hochladen pausieren',
      // Used as the screen reader label for the button that resumes a paused upload.
      resumeUpload: 'Hochladen fortsetzen',
      // Used as the screen reader label for the button that cancels an upload.
      cancelUpload: 'Hochladen abbrechen',
      // When `showProgressDetails` is set, shows the number of files that have been fully uploaded so far.
      filesUploadedOfTotal: {
        0: '%{complete} von %{smart_count} Datei hochgeladen',
        1: '%{complete} von %{smart_count} Dateien hochgeladen'
      },
      // When `showProgressDetails` is set, shows the amount of bytes that have been uploaded so far.
      dataUploadedOfTotal: '%{complete} von %{total}',
      // When `showProgressDetails` is set, shows an estimation of how long the upload will take to complete.
      xTimeLeft: '%{time} verbleibend',
      // Used as the label for the button that starts an upload.
      uploadXFiles: {
        0: '%{smart_count} Datei hochladen',
        1: '%{smart_count} Dateien hochladen'
      },
      // Used as the label for the button that starts an upload, if another upload has been started in the past
      // and new files were added later.
      uploadXNewFiles: {
        0: '+%{smart_count} Datei hochladen',
        1: '+%{smart_count} Dateien hochladen'
      }
    }
*/
