const uz_UZ = {
  pluralize (count) {
    if (count === 1) {
      return 0
    }
    return 1
  },
}

uz_UZ.strings = {
  addBulkFilesFailed: {
    '0': 'Ichki xatolik tufayli %{smart_count} faylni qo‘shib bo‘lmadi',
    '1': 'Ichki xatolar tufayli %{smart_count} ta fayl qo‘shib bo‘lmadi',
  },
  addingMoreFiles: "Ko'proq fayllar qo'shilmoqda",
  addMore: 'Yana qoʻshing',
  addMoreFiles: "Ko'proq fayllar qo'shing",
  allFilesFromFolderNamed: '%{name} jildidagi barcha fayllar',
  allowAccessDescription:
    'Kamerangiz bilan suratga olish yoki video yozib olish uchun ushbu sayt uchun kameradan foydalanishga ruxsat bering.',
  allowAccessTitle: 'Iltimos, kamerangizga kirishga ruxsat bering',
  allowAudioAccessDescription:
    'Audio yozib olish uchun ushbu sayt uchun mikrofondan foydalanishga ruxsat bering.',
  allowAudioAccessTitle: 'Mikrofonga kirishga ruxsat bering',
  aspectRatioLandscape: 'Landshaft kesish (16:9)',
  aspectRatioPortrait: 'Portretni kesish (9:16)',
  aspectRatioSquare: 'Kvadrat kesish',
  authAborted: 'Autentifikatsiya bekor qilindi',
  authenticateWith: '%{pluginName} ga ulaning',
  authenticateWithTitle:
    'Fayllarni tanlash uchun %{pluginName} bilan autentifikatsiya qiling',
  back: 'Orqaga',
  browse: "ko'rib chiqish",
  browseFiles: "fayllarni ko'rib chiqish",
  browseFolders: "papkalarni ko'rib chiqish",
  cancel: 'Bekor qilish',
  cancelUpload: 'Yuklashni bekor qilish',
  chooseFiles: 'Fayllarni tanlang',
  closeModal: 'Modalni yoping',
  companionError: 'Companiya bilan ulanish amalga oshmadi',
  companionUnauthorizeHint:
    '%{provider} hisobingizga ruxsat berish uchun %{url} sahifasiga o‘ting.',
  complete: 'Bajarildi',
  compressedX: 'Rasmlarni siqish orqali %{size} saqlangan',
  compressingImages: 'Tasvirlar siqilmoqda...',
  connectedToInternet: 'Internetga ulangan',
  copyLink: 'Havolani nusxalash',
  copyLinkToClipboardFallback: 'Quyidagi URL manzilidan nusxa oling',
  copyLinkToClipboardSuccess: 'Havola vaqtinchalik xotiraga nusxalandi.',
  creatingAssembly: 'Yuklash tayyorlanmoqda...',
  creatingAssemblyFailed: "Transloadit: Assambleyani yaratib bo'lmadi",
  dashboardTitle: 'Uppy boshqaruv paneli',
  dashboardWindowTitle:
    'Uppy asboblar paneli oynasi (yopish uchun escape tugmasini bosing)',
  dataUploadedOfTotal: '%{total} dan %{complete}',
  discardRecordedFile: 'Yozib olingan faylni olib tashlang',
  done: 'Bajarildi',
  dropHereOr: 'Bu yerga tashlang yoki %{browse}',
  dropHint: 'Fayllaringizni shu yerga tashlang',
  dropPasteBoth: 'Fayllarni bu yerga, %{browseFiles} yoki %{browseFolders} qoldiring.',
  dropPasteFiles: "Fayllarni bu yerga qo'ying yoki %{browseFiles}",
  dropPasteFolders: 'Fayllarni shu yerga yoki %{browseFolders} qoldiring',
  dropPasteImportBoth:
    'Fayllarni bu yerga tashlang, %{browseFiles}, %{browseFolders} yoki import qiling:',
  dropPasteImportFiles: 'Fayllarni bu yerga tashlang, %{browseFiles} yoki import qiling:',
  dropPasteImportFolders:
    'Fayllarni bu yerga tashlang, %{browseFolders} yoki import qiling:',
  editFile: 'Faylni tahrirlash',
  editFileWithFilename: '%{file} faylini tahrirlash',
  editing: '%{file} tahrirlanmoqda',
  emptyFolderAdded: "Bo'sh jilddan hech qanday fayl qo'shilmadi",
  encoding: 'Kodlanmoqda...',
  enterCorrectUrl:
    "Noto'g'ri URL: faylga to'g'ridan-to'g'ri havolani kiritayotganingizga ishonch hosil qiling",
  enterTextToSearch: 'Rasmlarni qidirish uchun matnni kiriting',
  enterUrlToImport: 'Faylni import qilish uchun URL manzilini kiriting',
  exceedsSize: '%{file} maksimal ruxsat etilgan %{size} hajmidan oshib ketdi',
  failedToFetch:
    'Companion bu URL manzilni ololmadi, uning to‘g‘riligiga ishonch hosil qiling',
  failedToUpload: '%{file} yuklanmadi',
  filesUploadedOfTotal: {
    '0': '%{smart_count} fayldan %{complete} ta fayl yuklandi',
    '1': '%{complete} of %{smart_count} ta fayl yuklangan',
  },
  filter: 'Filtr',
  finishEditingFile: 'Faylni tahrirlashni tugating',
  flipHorizontal: 'Gorizontal aylantiring',
  folderAdded: {
    '0': '%{folder} dan %{smart_count} fayl qo‘shildi',
    '1': '%{folder} dan %{smart_count} ta fayl qo‘shildi',
  },
  folderAlreadyAdded: '“%{folder}” jild allaqachon qo‘shilgan',
  generatingThumbnails: 'Eskiz yaratilmoqda...',
  import: 'Import',
  importFiles: 'Fayllarni import qiling:',
  importFrom: '%{name} dan import qilish',
  inferiorSize: 'Bu fayl ruxsat etilgan %{size} hajmidan kichikroq',
  loading: 'Yuklanmoqda...',
  logOut: 'Chiqish',
  micDisabled: 'Mikrofonga kirish foydalanuvchi tomonidan rad etilgan',
  missingRequiredMetaField: 'Majburiy meta-maydonlar yetishmayapti',
  missingRequiredMetaFieldOnFile:
    '%{fileName} faylida zarur meta-maydonlar yetishmayapti',
  missingRequiredMetaFields: {
    '0': 'Kerakli meta-maydon yetishmayapti: %{fields}.',
    '1': 'Kerakli meta-maydonlar etishmayapti: %{fields}.',
  },
  myDevice: 'Mening qurilmam',
  noAudioDescription:
    'Ovoz yozish uchun mikrofon yoki boshqa audio kiritish qurilmasini ulang',
  noAudioTitle: 'Mikrofon mavjud emas',
  noCameraDescription:
    'Rasmga olish yoki video yozib olish uchun kamera qurilmasini ulang',
  noCameraTitle: 'Kamera mavjud emas',
  noDuplicates:
    'Ikki nusxadagi “%{fileName}” faylini qo‘shib bo‘lmadi, u allaqachon mavjud',
  noFilesFound: 'Bu yerda sizda hech qanday fayl yoki papka yoʻq',
  noInternetConnection: "Internet aloqasi yo'q",
  noMoreFilesAllowed: 'Boshqa fayllar qo‘shib bo‘lmaydi',
  openFolderNamed: '%{name} jildini ochish',
  pause: 'Pauza',
  paused: 'Pauza qilingan',
  pauseUpload: 'Yuklashni toʻxtatib turish',
  pluginNameAudio: 'Audio',
  pluginNameBox: 'Quti',
  pluginNameCamera: 'Kamera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: '%{uppy} tomonidan quvvatlanadi',
  processingXFiles: {
    '0': '%{smart_count} faylga ishlov berilmoqda',
    '1': '%{smart_count} faylga ishlov berilmoqda',
  },
  recording: 'Yozib olish',
  recordingLength: 'Yozib olish uzunligi %{recording_length}',
  recordingStoppedMaxSize:
    'Fayl hajmi chegaradan oshib ketayotgani uchun yozib olish to‘xtatildi',
  recordVideoBtn: 'Video yozib olish',
  recoveredAllFiles:
    'Biz barcha fayllarni tikladik. Endi siz yuklashni davom ettirishingiz mumkin.',
  recoveredXFiles: {
    '0': '1 ta faylni toʻliq tiklay olmadik. Iltimos, uni qayta tanlang va yuklashni davom ettiring.',
    '1': '%{smart_count} ta faylni toʻliq tiklay olmadik. Iltimos, ularni qayta tanlang va yuklashni davom ettiring.',
  },
  removeFile: "Faylni o'chirish",
  reSelect: 'Qayta tanlang',
  resetFilter: 'Filtrni tiklash',
  resume: 'Rezyume',
  resumeUpload: 'Yuklashni davom ettiring',
  retry: 'Qayta urinish',
  retryUpload: 'Qayta yuklash',
  revert: 'Orqaga qaytarish',
  rotate: 'Aylantirish',
  save: 'Saqlash',
  saveChanges: "O'zgarishlarni saqlang",
  search: 'Qidirmoq',
  searchImages: 'Tasvirlarni qidirish',
  selectX: {
    '0': '%{smart_count} ni tanlang',
    '1': '%{smart_count} ni tanlang',
  },
  sessionRestored: 'Seans tiklandi',
  showErrorDetails: "Xato tafsilotlarini ko'rsatish",
  signInWithGoogle: 'Google bilan kiring',
  smile: 'Tabassum!',
  startAudioRecording: 'Ovoz yozishni boshlang',
  startCapturing: 'Ekranni suratga olishni boshlang',
  startRecording: 'Video yozishni boshlang',
  stopAudioRecording: "Ovoz yozishni to'xtating",
  stopCapturing: "Ekranni suratga olishni to'xtating",
  stopRecording: "Video yozishni to'xtating",
  streamActive: 'Oqim faol',
  streamPassive: 'Oqim passiv',
  submitRecordedFile: 'Yozib olingan faylni yuboring',
  takePicture: 'Rasmga oling',
  takePictureBtn: 'Rasmga olish',
  timedOut: 'Yuklash %{seconds} soniya to‘xtab qoldi, to‘xtatilmoqda.',
  upload: 'Yuklash',
  uploadComplete: 'Yuklash tugallandi',
  uploadFailed: 'Yuklab bo‘lmadi',
  uploading: 'Yuklanmoqda',
  uploadingXFiles: {
    '0': '%{smart_count} fayl yuklanmoqda',
    '1': '%{smart_count} ta fayl yuklanmoqda',
  },
  uploadPaused: "Yuklash to'xtatildi",
  uploadXFiles: {
    '0': '%{smart_count} faylni yuklang',
    '1': '%{smart_count} faylni yuklang',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} faylni yuklang',
    '1': '+%{smart_count} ta fayl yuklang',
  },
  xFilesSelected: {
    '0': '%{smart_count} fayl tanlandi',
    '1': '%{smart_count} ta fayl tanlandi',
  },
  xMoreFilesAdded: {
    '0': 'Yana %{smart_count} ta fayl qo‘shildi',
    '1': 'Yana %{smart_count} ta fayl qo‘shildi',
  },
  xTimeLeft: '%{time} chap',
  youCanOnlyUploadFileTypes: 'Siz faqat yuklashingiz mumkin: %{types}',
  youCanOnlyUploadX: {
    '0': 'Siz faqat %{smart_count} faylni yuklashingiz mumkin',
    '1': 'Siz faqat %{smart_count} ta faylni yuklashingiz mumkin',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Siz kamida %{smart_count} faylni tanlashingiz kerak',
    '1': 'Kamida %{smart_count} ta faylni tanlashingiz kerak',
  },
  zoomIn: 'Kattalashtirish',
  zoomOut: 'Kichraytirish',
}

if (typeof Uppy !== 'undefined') {
  globalThis.Uppy.locales.uz_UZ = uz_UZ
}

export default uz_UZ
