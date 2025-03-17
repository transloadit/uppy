/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Locale } from '@uppy/utils/lib/Translator'

const ms_MY: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

ms_MY.strings = {
  addBulkFilesFailed: {
    '0': 'Gagal untuk menambah %{smart_count} fail kerana ralat dalaman',
    '1': 'Gagal untuk menambah %{smart_count} fail kerana ralat dalaman',
  },
  addedNumFiles: '%{numFiles} fail berhasil ditambah',
  addingMoreFiles: 'Menambah lebih banyak fail',
  additionalRestrictionsFailed: '%{count} sekatan tambahan tidak dipenuhi',
  addMore: 'Tambah lagi',
  addMoreFiles: 'Tambah lebih banyak fail',
  aggregateExceedsSize:
    'Anda memilih %{size} fail, tetapi saiz maksimum yang dibenarkan adalah %{sizeAllowed}',
  allFilesFromFolderNamed: 'Semua fail daripada folder %{name}',
  allowAccessDescription:
    'Untuk mengambil gambar atau merakam video menggunakan kamera anda, sila benarkan akses kamera untuk laman ini.',
  allowAccessTitle: 'Sila benarkan akses ke kamera anda',
  allowAudioAccessDescription:
    'Untuk merakam audio, sila benarkan akses mikrofon untuk laman ini.',
  allowAudioAccessTitle: 'Sila benarkan akses ke mikrofon anda',
  aspectRatioLandscape: 'Pangkas landskap (16:9)',
  aspectRatioPortrait: 'Pangkas potret (9:16)',
  aspectRatioSquare: 'Pangkas segi empat',
  authAborted: 'Pengesahan dibatalkan',
  authenticateWith: 'Sambung ke %{pluginName}',
  authenticateWithTitle: 'Sila sahkan dengan %{pluginName} untuk memilih fail',
  back: 'Kembali',
  browse: 'semak imbas',
  browseFiles: 'semak imbas fail',
  browseFolders: 'semak imbas folder',
  cancel: 'Batal',
  cancelUpload: 'Batal muat naik',
  chooseFiles: 'Pilih fail',
  closeModal: 'Tutup Modal',
  companionError: 'Sambungan ke Companion gagal',
  companionUnauthorizeHint:
    'Untuk tidak membenarkan akaun %{provider} anda, sila pergi ke %{url}',
  complete: 'Selesai',
  compressedX: '%{size} tersimpan dengan memampatkan gambar',
  compressingImages: 'Mampatkan gambar...',
  connectedToInternet: 'Terhubung ke Internet',
  copyLink: 'Salin pautan',
  copyLinkToClipboardFallback: 'Salin URL di bawah',
  copyLinkToClipboardSuccess: 'Pautan disalin ke papan keratan.',
  creatingAssembly: 'Menyediakan muat naik...',
  creatingAssemblyFailed: 'Transloadit: Tidak dapat membuat Perhimpunan',
  dashboardTitle: 'Papan Pemuka Uppy',
  dashboardWindowTitle:
    'Tetingkap Papan Pemuka Uppy (Tekan escape untuk menutup)',
  dataUploadedOfTotal: '%{complete} dari %{total}',
  discardRecordedFile: 'Buang fail yang dirakam',
  done: 'Selesai',
  dropHereOr: 'Letakkan di sini atau %{browse}',
  dropHint: 'Letakkan fail anda di sini',
  dropPasteBoth: 'Letakkan fail di sini, %{browseFiles} atau %{browseFolders}',
  dropPasteFiles: 'Letakkan fail di sini atau %{browseFiles}',
  dropPasteFolders: 'Letakkan folder di sini atau %{browseFolders}',
  dropPasteImportBoth:
    'Letakkan folder di sini, %{browseFiles}, %{browseFolders} atau import daripada:',
  dropPasteImportFiles:
    'Letakkan fail di sini, %{browseFiles} atau import daripada:',
  dropPasteImportFolders:
    'Letakkan fail di sini, %{browseFolders} atau import daripada:',
  editFile: 'Edit fail',
  editFileWithFilename: 'Edit fail %{file}',
  editImage: 'Edit gambar',
  editing: 'Mengedit %{file}',
  emptyFolderAdded: 'Tiada fail yang ditambah daripada folder kosong',
  encoding: 'Pengekodan...',
  enterCorrectUrl:
    'URL salah: Sila pastikan anda memasukkan pautan terus ke fail',
  enterTextToSearch: 'Masukkan teks untuk mencari imej',
  enterUrlToImport: 'Masukkan URL untuk mengimport fail',
  error: 'Ralat',
  exceedsSize: '%{file} melebihi saiz maksimum yang dibenarkan iaitu %{size}',
  failedToFetch: 'Companion gagal mengambil URL ini, sila pastikan URL betul',
  failedToUpload: 'Gagal memuat naik %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} dari %{smart_count} fail dimuat naik',
    '1': '%{complete} dari %{smart_count} fail dimuat naik',
  },
  filter: 'Tapis',
  finishEditingFile: 'Selesai mengedit fail',
  flipHorizontal: 'Flip mendatar',
  folderAdded: {
    '0': '%{smart_count} fail ditambah dari %{folder}',
    '1': '%{smart_count} fail ditambah dari %{folder}',
  },
  folderAlreadyAdded: 'Folder "%{folder}" telah pun ditambah',
  generatingThumbnails: 'Menjana lakaran kecil...',
  import: 'Import',
  importFiles: 'Import fail dari:',
  importFrom: 'Import dari %{name}',
  inferiorSize:
    'Fail ini lebih kecil daripada saiz yang dibenarkan iaitu %{size}',
  loadedXFiles: '%{numFiles} fail telah dimuatkan',
  loading: 'Memuatkan...',
  logOut: 'Log keluar',
  micDisabled: 'Akses mikrofon dinafikan oleh pengguna',
  missingRequiredMetaField: 'Medan meta yang diperlukan tiada',
  missingRequiredMetaFieldOnFile:
    'Tiada medan meta yang diperlukan dalam %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Medan meta yang diperlukan tiada: %{fields}.',
    '1': 'Medan meta yang diperlukan tiada: %{fields}.',
  },
  myDevice: 'Peranti Saya',
  noAudioDescription:
    'Untuk merakam audio, sila sambungkan mikrofon atau peranti input audio lain',
  noAudioTitle: 'Microphone Not Available',
  noCameraDescription:
    'Untuk mengambil gambar atau merakam video, sila sambungkan peranti kamera',
  noCameraTitle: 'Kamera Tidak Tersedia',
  noDuplicates:
    "Tidak boleh menambah fail pendua '%{fileName}', ia sudah wujud",
  noFilesFound: 'Anda tidak mempunyai fail atau folder di sini',
  noInternetConnection: 'Tiada sambungan Internet',
  noMoreFilesAllowed: 'Tidak boleh menambah lebih banyak fail',
  noSearchResults: 'Malangnya, tiada hasil untuk carian ini',
  openFolderNamed: 'Buka folder %{name}',
  pause: 'Jeda',
  paused: 'Dijeda',
  pauseUpload: 'Jeda muat naik',
  pluginNameAudio: 'Audio',
  pluginNameBox: 'Kotak',
  pluginNameCamera: 'Kamera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Screencast',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Link',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Dikuasakan oleh %{uppy}',
  processingXFiles: {
    '0': 'Memproses %{smart_count} fail',
    '1': 'Memproses %{smart_count} fail',
  },
  recording: 'Merakam',
  recordingLength: 'Panjang rakaman %{recording_length}',
  recordingStoppedMaxSize:
    'Rakaman dihentikan kerana saiz fail hampir melebihi had',
  recordVideoBtn: 'Rakam Video',
  recoveredAllFiles:
    'Kami memulihkan semua fail. Anda kini boleh menyambung semula muat naik.',
  recoveredXFiles: {
    '0': 'Kami tidak dapat memulihkan 1 fail sepenuhnya. Sila pilih semula dan sambung muat naik.',
    '1': 'Kami tidak dapat memulihkan %{smart_count} fail sepenuhnya. Sila pilih semula dan sambung muat naik.',
  },
  removeFile: 'Buang fail',
  reSelect: 'Pilih semula',
  resetFilter: 'Tetap semua tapisan',
  resetSearch: 'Tetap semua carian',
  resume: 'Sambung semula',
  resumeUpload: 'Sambung semula muat naik',
  retry: 'Cuba semula',
  retryUpload: 'Cuba semula muat naik',
  revert: 'Tetap semula',
  rotate: 'Putar 90°',
  save: 'Simpan',
  saveChanges: 'Simpan perubahan',
  search: 'Carian',
  searchImages: 'Cari gambar',
  selectX: {
    '0': 'Pilih %{smart_count}',
    '1': 'Pilih %{smart_count}',
  },
  sessionRestored: 'Sesi dipulihkan',
  showErrorDetails: 'Tunjukkan butiran ralat',
  signInWithGoogle: 'Log masuk dengan Google',
  smile: 'Senyum!',
  startAudioRecording: 'Mulakan rakaman audio',
  startCapturing: 'Mulakan tangkapan skrin',
  startRecording: 'Mulakan rakaman video',
  stopAudioRecording: 'Hentikan rakaman audio',
  stopCapturing: 'Hentikan tangkapan skrin',
  stopRecording: 'Hentikan rakaman video',
  streamActive: 'Strim aktif',
  streamPassive: 'Strim pasif',
  submitRecordedFile: 'Serahkan fail yang direkodkan',
  takePicture: 'Ambil gambar',
  takePictureBtn: 'Ambil Gambar',
  unnamed: 'Tidak bernama',
  upload: 'Muat naik',
  uploadComplete: 'Muat naik selesai',
  uploadFailed: 'Muat naik gagal',
  uploading: 'Memuat naik',
  uploadingXFiles: {
    '0': 'Muat naik %{smart_count} fail',
    '1': 'Muat naik %{smart_count} fail',
  },
  uploadPaused: 'Muat naik dijeda',
  uploadStalled:
    'Muat naik tidak membuat sebarang kemajuan selama %{seconds} saat. Anda mungkin mahu mencubanya semula.',
  uploadXFiles: {
    '0': 'Muat naik %{smart_count} fail',
    '1': 'Muat naik %{smart_count} fail',
  },
  uploadXNewFiles: {
    '0': 'Muat naik +%{smart_count} fail',
    '1': 'Muat naik +%{smart_count} fail',
  },
  xFilesSelected: {
    '0': '%{smart_count} fail dipilih',
    '1': '%{smart_count} fail dipilih',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} lagi fail ditambah',
    '1': '%{smart_count} lagi fail ditambah',
  },
  xTimeLeft: '%{time} lagi tinggal',
  youCanOnlyUploadFileTypes: 'Anda hanya boleh muat naik: %{types}',
  youCanOnlyUploadX: {
    '0': 'Anda hanya boleh muat naik %{smart_count} fail',
    '1': 'Anda hanya boleh muat naik %{smart_count} fail',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Anda perlu memilih sekurang-kurangnya %{smart_count} fail',
    '1': 'Anda perlu memilih sekurang-kurangnya %{smart_count} fail',
  },
  zoomIn: 'Zum masuk',
  zoomOut: 'Zum keluar',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ms_MY = ms_MY
}

export default ms_MY
