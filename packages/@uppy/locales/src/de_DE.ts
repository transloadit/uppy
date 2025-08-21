import type { Locale } from '@uppy/utils'

const de_DE: Locale<0 | 1> = {
  strings: {},
  pluralize(count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

de_DE.strings = {
  addBulkFilesFailed: {
    '0': 'Das Hinzufügen einer Datei ist aufgrund eines internen Fehlers fehlgeschlagen',
    '1': 'Das Hinzufügen von %{smart_count} Dateien ist aufgrund eines internen Fehlers fehlgeschlagen',
  },
  addingMoreFiles: 'Dateien hinzufügen',
  addMore: 'Mehr hinzufügen',
  addMoreFiles: 'Dateien hinzufügen',
  allFilesFromFolderNamed: 'Alle Dateien vom Ordner %{name}',
  allowAccessDescription:
    'Um Bilder oder Videos mit Ihrer Kamera aufzunehmen, erlauben Sie dieser Website bitte den Zugriff auf Ihre Kamera.',
  allowAccessTitle: 'Bitte erlauben Sie Zugriff auf Ihre Kamera',
  aspectRatioLandscape: 'Zuschneiden auf Querformat (16:9)',
  aspectRatioPortrait: 'Zuschneiden auf Hochformat (9:16)',
  aspectRatioSquare: 'Zuschneiden auf Quadrat',
  authenticateWith: 'Mit %{pluginName} verbinden',
  authenticateWithTitle:
    'Bitte authentifizieren Sie sich mit %{pluginName}, um Dateien auszuwählen',
  back: 'Zurück',
  backToSearch: 'Zurück zur Suche',
  browse: 'durchsuchen',
  browseFiles: 'Dateien durchsuchen',
  browseFolders: 'Ordner durchsuchen',
  cancel: 'Abbrechen',
  cancelUpload: 'Hochladen abbrechen',
  closeModal: 'Fenster schließen',
  companionError: 'Verbindung zu Companion fehlgeschlagen',
  companionUnauthorizeHint:
    'Um die Autorisierung für Ihr %{provider} Konto aufzuheben, gehen Sie bitte zu %{url}',
  complete: 'Fertig',
  connectedToInternet: 'Mit dem Internet verbunden',
  copyLink: 'Link kopieren',
  copyLinkToClipboardFallback: 'Untenstehende URL kopieren',
  copyLinkToClipboardSuccess: 'Link in die Zwischenablage kopiert',
  creatingAssembly: 'Das Hochladen wird vorbereiten...',
  creatingAssemblyFailed: 'Transloadit: Assembly konnte nicht erstellt werden',
  dashboardTitle: 'Hochladen von Dateien',
  dashboardWindowTitle: 'Hochladen von Dateien (ESC drücken zum Schließen)',
  dataUploadedOfTotal: '%{complete} von %{total}',
  discardRecordedFile: 'Aufgenommene Datei verwerfen',
  done: 'Abgeschlossen',
  dropHint: 'Dateien hier ablegen',
  dropPasteBoth:
    'Dateien hier ablegen/einfügen, %{browseFiles} oder %{browseFolders}',
  dropPasteFiles: 'Dateien hier ablegen/einfügen oder %{browseFiles}',
  dropPasteFolders: 'Dateien hier ablegen/einfügen oder %{browseFolders}',
  dropPasteImportBoth:
    'Dateien hier ablegen/einfügen, %{browse} oder von folgenden Quellen importieren:',
  dropPasteImportFiles:
    'Dateien hier ablegen/einfügen, %{browseFiles} oder von folgenden Quellen importieren:',
  dropPasteImportFolders:
    'Dateien hier ablegen/einfügen, %{browseFolders} oder von folgenden Quellen importieren:',
  editFile: 'Datei bearbeiten',
  editImage: 'Bild bearbeiten',
  editFileWithFilename: 'Datei %{file} bearbeiten',
  editing: '%{file} bearbeiten',
  emptyFolderAdded: 'Keine Dateien hinzugefügt, da der Ordner leer war',
  encoding: 'Kodieren...',
  enterCorrectUrl:
    'Falsche URL: Bitte stellen Sie sicher, dass Sie einen direkten Link zu einer Datei eingeben',
  enterTextToSearch: 'Text zum Suchen von Bildern eingeben',
  enterUrlToImport: 'URL zum Importieren einer Datei eingeben',
  exceedsSize:
    'Datei %{file} ist größer als die maximal erlaubte Dateigröße von %{size}',
  failedToFetch:
    'Companion konnte diese URL nicht verarbeiten - stellen Sie bitte sicher, dass sie korrekt ist',
  failedToUpload: 'Fehler beim Hochladen der Datei %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} von %{smart_count} Datei hochgeladen',
    '1': '%{complete} von %{smart_count} Dateien hochgeladen',
  },
  filter: 'Filter',
  finishEditingFile: 'Bearbeitung beenden',
  flipHorizontal: 'Horizontal spiegeln',
  folderAdded: {
    '0': 'Eine Datei von %{folder} hinzugefügt',
    '1': '%{smart_count} Dateien von %{folder} hinzugefügt',
  },
  folderAlreadyAdded: 'Der Ordner "%{folder}" wurde bereits hinzugefügt',
  generatingThumbnails: 'Erstellen von Miniaturansichten...',
  import: 'Importieren',
  importFiles: 'Importiere Dateien von:',
  importFrom: 'Importieren von %{name}',
  inferiorSize:
    'Diese Datei ist kleiner als die minimal erlaubte Dateigröße von %{size}',
  loading: 'Laden...',
  logOut: 'Abmelden',
  micDisabled: 'Zugriff auf Mikrofon von Benutzer abgelehnt',
  missingRequiredMetaField: 'Fehlende erforderliche Meta-Felder',
  missingRequiredMetaFieldOnFile:
    'Fehlende erforderliche Meta-Felder in %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Fehlendes erforderliches Meta-Feld: %{fields}.',
    '1': 'Fehlende erforderliche Meta-Felder: %{fields}.',
  },
  myDevice: 'Mein Gerät',
  noCameraDescription:
    'Bitte Kamera anschließen, um Bilder oder Videos aufzunehmen',
  noCameraTitle: 'Kamera nicht verfügbar',
  noDuplicates:
    "Datei '%{fileName}' existiert bereits und kann nicht erneut hinzugefügt werden",
  noFilesFound: 'Sie haben hier keine Dateien oder Ordner',
  noInternetConnection: 'Keine Internetverbindung',
  noMoreFilesAllowed:
    'Während der Upload läuft, können keine weiteren Dateien hinzugefügt werden',
  openFolderNamed: 'Ordner %{name} öffnen',
  pause: 'Pausieren',
  paused: 'Pausiert',
  pauseUpload: 'Hochladen pausieren',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Kamera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': 'Eine Datei verarbeiten',
    '1': '%{smart_count} Dateien verarbeiten',
  },
  recording: 'Aufnahme',
  recordingLength: 'Aufnahmedauer %{recording_length}',
  recordingStoppedMaxSize:
    'Die Aufnahme wurde gestoppt, weil die Dateigröße das Limit überschritten hat',
  recordVideoBtn: 'Video aufnehmen',
  recoveredAllFiles:
    'Wir haben alle Dateien wiederhergestellt. Sie können mit dem Hochladen fortfahren.',
  recoveredXFiles: {
    '0': 'Wir konnten eine Datei nicht vollständig wiederherstellen. Bitte wählen Sie sie erneut aus und fahren Sie dann mit dem Hochladen fort.',
    '1': 'Wir konnten %{smart_count} Dateien nicht vollständig wiederherstellen. Bitte wählen Sie sie erneut aus und fahren Sie dann mit dem Hochladen fort.',
  },
  removeFile: 'Datei entfernen',
  reSelect: 'Erneut auswählen',
  resetFilter: 'Filter zurücksetzen',
  resume: 'Fortsetzen',
  resumeUpload: 'Hochladen fortsetzen',
  retry: 'Erneut versuchen',
  retryUpload: 'Hochladen erneut versuchen',
  revert: 'Rückgängig machen',
  rotate: 'Drehen',
  save: 'Speichern',
  saveChanges: 'Änderungen speichern',
  searchImages: 'Suche nach Bildern',
  selectX: {
    '0': 'Wählen Sie %{smart_count}',
    '1': 'Wählen Sie %{smart_count}',
  },
  sessionRestored: '',
  smile: 'Bitte lächeln!',
  startCapturing: 'Bildschirmaufnahme starten',
  startRecording: 'Videoaufnahme starten',
  stopCapturing: 'Bildschirmaufnahme stoppen',
  stopRecording: 'Videoaufnahme stoppen',
  streamActive: 'Stream aktiv',
  streamPassive: 'Stream passiv',
  submitRecordedFile: 'Aufgezeichnete Datei verwenden',
  takePicture: 'Ein Foto aufnehmen',
  takePictureBtn: 'Foto aufnehmen',
  timedOut: 'Upload für %{seconds} Sekunden stehen geblieben, breche ab.',
  upload: 'Hochladen',
  uploadComplete: 'Hochladen abgeschlossen',
  uploadFailed: 'Hochladen fehlgeschlagen',
  uploading: 'Wird hochgeladen',
  uploadingXFiles: {
    '0': 'Eine Datei wird hochgeladen',
    '1': '%{smart_count} Dateien werden hochgeladen',
  },
  uploadPaused: 'Hochladen pausiert',
  uploadXFiles: {
    '0': 'Eine Datei hochladen',
    '1': '%{smart_count} Dateien hochladen',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} Datei hochladen',
    '1': '+%{smart_count} Dateien hochladen',
  },
  xFilesSelected: {
    '0': 'Eine Datei ausgewählt',
    '1': '%{smart_count} Dateien ausgewählt',
  },
  xMoreFilesAdded: {
    '0': 'Eine weitere Datei hinzugefügt',
    '1': '%{smart_count} weitere Dateien hinzugefügt',
  },
  xTimeLeft: '%{time} verbleibend',
  youCanOnlyUploadFileTypes:
    'Sie können nur folgende Dateitypen hochladen: %{types}',
  youCanOnlyUploadX: {
    '0': 'Sie können nur eine Datei hochladen',
    '1': 'Sie können nur %{smart_count} Dateien hochladen',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Sie müssen mindestens eine Datei auswählen',
    '1': 'Sie müssen mindestens %{smart_count} Dateien auswählen',
  },
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.de_DE = de_DE
}

export default de_DE
