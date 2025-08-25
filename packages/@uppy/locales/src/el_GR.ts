import type { Locale } from '@uppy/utils'

const el_GR: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 1
    }
    return 0
  },
}

el_GR.strings = {
  addMore: 'Προσθέστε περισσότερα',
  addMoreFiles: 'Προσθέστε περισσότερα αρχεία',
  addingMoreFiles: 'Προσθήκη αρχείων',
  allowAccessDescription:
    'Για να βγάλετε φωτογραφίες ή βίντεο με την κάμερά σας, παρακαλούμε επιτρέψτε την πρόσβαση στην κάμερά σας για αυτόν τον ιστότοπο.',
  allowAccessTitle: 'Παρακαλούμε επιτρέψτε την πρόσβαση στην κάμερά σας',
  authenticateWith: 'Σύνδεση με %{pluginName}',
  authenticateWithTitle:
    'Παρακαλούμε συνδεθείτε με %{pluginName} για να επιλέξετε αρχεία',
  back: 'Πίσω',
  browse: 'Περιήγηση',
  browseFiles: 'Περιήγηση',
  cancel: 'Άκυρο',
  cancelUpload: 'Ακύρωση μεταφόρτωσης',
  closeModal: 'Κλείσιμο παραθύρου',
  companionError: 'Η σύνδεση με το Companion απέτυχε',
  complete: 'Ολοκληρώθηκε',
  connectedToInternet: 'Συνδεθήκατε στο Internet',
  copyLink: 'Αντιγραφή συνδέσμου',
  copyLinkToClipboardFallback: 'Αντιγραφή του παρακάτω συνδέσμου',
  copyLinkToClipboardSuccess: 'Ο σύνδεσμος αντιγράφηκε',
  creatingAssembly: 'Προετοιμασία μεταφόρτωσης...',
  creatingAssemblyFailed: 'Transloadit: Σφάλμα κατά την προετοιμασία',
  dashboardTitle: 'Μεταφόρτωση αρχείων',
  dashboardWindowTitle:
    'Παράθυρο μεταφόρτωσης αρχείων (Πατήστε escape για να κλείσει)',
  dataUploadedOfTotal: '%{complete} από %{total}',
  done: 'Τέλος',
  dropHint: 'Σύρετε τα αρχεία σας εδώ',
  dropPasteBoth: 'Σύρετε τα αρχεία εδώ, κάντε επικόλληση ή %{browse}',
  dropPasteFiles: 'Σύρετε τα αρχεία εδώ, κάντε επικόλληση ή %{browse}',
  dropPasteFolders: 'Σύρετε τα αρχεία εδώ, κάντε επικόλληση ή %{browse}',
  dropPasteImportBoth:
    'Σύρετε αρχεία εδώ, κάντε επικόλληση, %{browse} ή εισαγωγή από',
  dropPasteImportFiles:
    'Σύρετε αρχεία εδώ, κάντε επικόλληση, %{browse} ή εισαγωγή από',
  dropPasteImportFolders:
    'Σύρετε αρχεία εδώ, κάντε επικόλληση, %{browse} ή εισαγωγή από',
  editFile: 'Επεξεργασία αρχείου',
  editImage: 'Επεξεργασία εικόνας',
  editing: 'Γίνεται επεξεργασία %{file}',
  emptyFolderAdded: 'Δεν προστέθηκαν αρχεία από τον άδειο φάκελο',
  encoding: 'Γίνεται κωδικοποίηση...',
  enterCorrectUrl:
    'Λανθασμένο URL: Παρακαλούμε βεβαιωθείτε ότι εισάγετε έναν άμεσο σύνδεσμο προς κάποιο αρχείο',
  enterUrlToImport: 'Εισάγετε URL για να γίνει εισαγωγή του αρχείου',
  exceedsSize:
    'Το αρχείο υπερβαίνει το μέγιστο επιτρεπτό όριο που είναι %{size}',
  failedToFetch:
    'Δεν ήταν δυνατή η λήψη από το URL, παρακαλούμε βεβαιωθείτε ότι είναι σωστό',
  failedToUpload: 'Δεν ήταν δυνατή η μεταφόρτωση %{file}',
  fileSource: 'Πηγή αρχείου: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} από %{smart_count} αρχεία ανέβηκαν',
    '1': '%{complete} από %{smart_count} αρχείο ανέβηκε',
  },
  filter: 'Φιλτράρισμα',
  finishEditingFile: 'Ολοκλήρωση επεξεργασίας αρχείου',
  folderAdded: {
    '0': 'Προστέθηκαν %{smart_count} αρχεία από %{folder}',
    '1': 'Προστέθηκε %{smart_count} αρχείο από %{folder}',
  },
  import: 'Εισαγωγή',
  importFrom: 'Εισαγωγή από %{name}',
  loading: 'Φορτώνει...',
  logOut: 'Αποσύνδεση',
  myDevice: 'Η συσκευή μου',
  noFilesFound: 'Δεν υπάρχουν αρχεία ή φάκελοι εδώ',
  noInternetConnection: 'Δεν υπάρχει σύνδεση στο Internet',
  openFolderNamed: 'Άνοιγμα φακέλου %{name}',
  pause: 'Παύση',
  pauseUpload: 'Παύση μεταφόρτωσης',
  paused: 'Έγινε παύση',
  poweredBy: 'Με τη δύναμη τού %{uppy}',
  processingXFiles: {
    '0': 'Προετοιμασία %{smart_count} αρχείων',
    '1': 'Προετοιμασία %{smart_count} αρχείου',
  },
  removeFile: 'Αφαίρεση αρχείου',
  resetFilter: 'Επαναφορά φίλτρου',
  resume: 'Συνέχεια',
  resumeUpload: 'Συνέχεια μεταφόρτωσης',
  retry: 'Προσπάθεια ξανά',
  retryUpload: 'Προσπάθεια μεταφόρτωσης ξανά',
  saveChanges: 'Αποθήκευση αλλαγών',
  selectFileNamed: 'Επιλογή αρχείου %{name}',
  selectX: {
    '0': 'Επιλογή %{smart_count}',
    '1': 'Επιλογή %{smart_count}',
  },
  smile: 'Χαμογελάστε!',
  startRecording: 'Ξεκίνημα εγγραφής βίντεο',
  stopRecording: 'Σταμάτημα εγγραφής βίντεο',
  takePicture: 'Βγάλτε μια φωτογραφία',
  timedOut:
    'Η μεταφόρτωση σταμάτησε για %{seconds} δευτερόλεπτα, γίνεται ακύρωση.',
  unselectFileNamed: 'Αποεπιλογή αρχείου %{name}',
  upload: 'Μεταφόρτωση',
  uploadComplete: 'Μεταφόρτωση ολοκληρώθηκε',
  uploadFailed: 'Μεταφόρτωση απέτυχε',
  uploadPaused: 'Μεταφόρτωση σε παύση',
  uploadXFiles: {
    '0': 'Μεταφόρτωση %{smart_count} αρχείων',
    '1': 'Μεταφόρτωση %{smart_count} αρχείου',
  },
  uploadXNewFiles: {
    '0': 'Μεταφόρτωση +%{smart_count} αρχείων',
    '1': 'Μεταφόρτωση +%{smart_count} αρχείου',
  },
  uploading: 'Γίνεται μεταφόρτωση',
  uploadingXFiles: {
    '0': 'Μεταφορτώνονται %{smart_count} αρχεία',
    '1': 'Μεταφορτώνεται %{smart_count} αρχείο',
  },
  xFilesSelected: {
    '0': '%{smart_count} επιλεγμένα αρχεία',
    '1': '%{smart_count} επιλεγμένο αρχείο',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} ακόμα αρχεία προστέθηκαν',
    '1': '%{smart_count} ακόμα αρχείο προστέθηκε',
  },
  xTimeLeft: '%{time} απομένουν',
  youCanOnlyUploadFileTypes: 'Μπορείτε να ανεβάσετε μόνο: %{types}',
  youCanOnlyUploadX: {
    '0': 'Μπορείτε να ανεβάσετε μόνο %{smart_count} αρχεία',
    '1': 'Μπορείτε να ανεβάσετε μόνο %{smart_count} αρχείο',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Πρέπει να επιλέξετε τουλάχιστον %{smart_count} αρχεία',
    '1': 'Πρέπει να επιλέξετε τουλάχιστον %{smart_count} αρχείο',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.el_GR = el_GR
}

export default el_GR
