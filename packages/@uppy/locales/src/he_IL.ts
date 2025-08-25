import type { Locale } from '@uppy/utils'

const he_IL: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

he_IL.strings = {
  addMore: 'הוסף עוד',
  addMoreFiles: 'הוסף עוד קבצים',
  addingMoreFiles: 'מוסיף עוד קבצים',
  allowAccessDescription:
    'על מנת לצלם תמונה או להקליט ווידאו עם המצלמה, בבקשה אפשר גישה למצלמה באתר זה.',
  allowAccessTitle: 'אנא אפשר גישה למצלמה',
  authenticateWith: 'התחבר ל %{pluginName}',
  authenticateWithTitle: 'אנא בצע הזדהות עם %{pluginName} על מנת לבחור קבצים',
  back: 'חזרה',
  browse: 'בחר',
  browseFiles: 'בחר',
  cancel: 'ביטול',
  cancelUpload: 'בטל העלאה',
  closeModal: 'חלון',
  companionError: 'הזדהות מול השירות נכשלה',
  companionUnauthorizeHint:
    'על מנת לבטל הזדהות חשבון %{provider}, אנא גלוש ל %{url}',
  complete: 'הסתיים',
  connectedToInternet: 'מחובר לאינטרנט',
  copyLink: 'העתק קישור',
  copyLinkToClipboardFallback: 'העתק את הקישור הבא',
  copyLinkToClipboardSuccess: 'הקישור הועתק',
  creatingAssembly: 'מכין העלאה..',
  creatingAssemblyFailed: 'Transloadit: יצירת המידע נכשל',
  dashboardTitle: 'העלאת קבצים',
  dashboardWindowTitle: 'חלון העלאת קבצים (לחץ escape לסגירה)',
  dataUploadedOfTotal: '%{complete} מתוך %{total}',
  done: 'סיים',
  dropHint: 'גרור קבצים לכאן',
  dropPasteBoth: 'גרור לכאן קבצים, הדבק או %{browse}',
  dropPasteFiles: 'גרור לכאן קבצים, הדבק או %{browse}',
  dropPasteFolders: 'גרור לכאן קבצים, הדבק או %{browse}',
  dropPasteImportBoth: 'גרור לכאן קבצים, הדבק, %{browse} או ייבא מ',
  dropPasteImportFiles: 'גרור לכאן קבצים, הדבק, %{browse} או ייבא מ',
  dropPasteImportFolders: 'גרור לכאן קבצים, הדבק, %{browse} או ייבא מ',
  editFile: 'ערוך קובץ',
  editImage: 'ערוך תמונה',
  editing: 'מעדכן %{file}',
  emptyFolderAdded: 'לא נוספו קבצים מהתיקיה הריקה',
  encoding: 'מקודד...',
  enterCorrectUrl: 'כתובת לא חוקית: אנא וודא שהכתובת ישירה לקובץ',
  enterUrlToImport: 'הזן כתובת לייבוא קבוץ',
  exceedsSize: 'קובץ זה גדול מהגודל המקסימאלי המותר %{size}',
  failedToFetch: 'השירות נכשל לטפל בכתובת זו, אנא וודא שהיא נכונה',
  failedToUpload: 'העלאת הקובץ %{file} נכשלה',
  fileSource: 'קובץ מקור: %{name}',
  filesUploadedOfTotal: {
    '0': 'קובץ %{complete} מתוך %{smart_count} הועלה',
    '1': '%{complete} מתוך %{smart_count} קבצים הועלו',
  },
  filter: 'סינון',
  finishEditingFile: 'סיים לעדכן את הקובץ',
  folderAdded: {
    '0': 'נוסף קובץ %{smart_count} מ %{folder}',
    '1': 'נוספו %{smart_count} קבצים מ %{folder}',
  },
  generatingThumbnails: 'יוצר תמונות ממוזערות...',
  import: 'ייבוא',
  importFrom: 'ייבוא מ %{name}',
  loading: 'טוען...',
  logOut: 'התנתק',
  myDevice: 'המכשיר שלי',
  noFilesFound: 'אין כאן קבצים או תיקיות',
  noInternetConnection: 'אין חיבור לאינטרנט',
  openFolderNamed: 'פתח קובץ %{name}',
  pause: 'השהה',
  pauseUpload: 'השהה העלאה',
  paused: 'מושהה',
  poweredBy: 'בחסות %{uppy}',
  processingXFiles: {
    '0': 'מעבד קובץ %{smart_count}',
    '1': 'מעבד %{smart_count} קבצים',
  },
  removeFile: 'מחק קובץ',
  resetFilter: 'אפס סינון',
  resume: 'המשך',
  resumeUpload: 'המשך העלאה',
  retry: 'נסה שוב',
  retryUpload: 'נסה להעלות שוב',
  saveChanges: 'שמור שינויים',
  selectFileNamed: 'בחר את הקובץ %{name}',
  selectX: {
    '0': 'בחר %{smart_count}',
    '1': 'בחר %{smart_count}',
  },
  smile: 'Smile!',
  startRecording: 'מתחיל הסרטת ווידאו',
  stopRecording: 'עצור הסרטת ווידאו',
  takePicture: 'צלם תמונה',
  timedOut: 'העלאה נתקעה %{seconds} שניות, מבטל.',
  unselectFileNamed: 'בטל בחירת הקובץ %{name}',
  upload: 'מעלה',
  uploadComplete: 'העלאה הסתיימה',
  uploadFailed: 'העלאה נכשלה',
  uploadPaused: 'העלאה מושהת',
  uploadXFiles: {
    '0': 'העלה קובץ %{smart_count}',
    '1': 'העלה %{smart_count} קבצים',
  },
  uploadXNewFiles: {
    '0': 'העלה קובץ +%{smart_count}',
    '1': 'העלה +%{smart_count} קבצים',
  },
  uploading: 'Uploading',
  uploadingXFiles: {
    '0': 'מעלה קובץ %{smart_count}',
    '1': 'מעלה %{smart_count} קבצים',
  },
  xFilesSelected: {
    '0': 'קובץ %{smart_count} נבחר',
    '1': '%{smart_count} קבצים נבחרו',
  },
  xMoreFilesAdded: {
    '0': 'עוד %{smart_count} קובץ נוסף',
    '1': 'עוד %{smart_count} קבצים נוספו',
  },
  xTimeLeft: '%{time} left',
  youCanOnlyUploadFileTypes: 'You can only upload: %{types}',
  youCanOnlyUploadX: {
    '0': 'ניתן העלות רק קובץ %{smart_count}',
    '1': 'ניתן להעלות רק %{smart_count} קבצים',
  },
  youHaveToAtLeastSelectX: {
    '0': 'עליך לבחור לפחות בקובץ %{smart_count}',
    '1': 'עליך לבחור לפחות ב %{smart_count} קבצים',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.he_IL = he_IL
}

export default he_IL
