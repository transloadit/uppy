import type { Locale } from '@uppy/utils'

const id_ID: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

id_ID.strings = {
  addMore: 'Tambahkan lebih banyak',
  addMoreFiles: 'Tambahkan lebih banyak berkas',
  addingMoreFiles: 'Menambahkan lebih banyak berkas',
  allowAccessDescription:
    'Untuk mengambil gambar atau merekam video menggunakan kamera Anda, mohon izinkan akses kamera untuk situs ini.',
  allowAccessTitle: 'Mohon izinkan akses ke kamera Anda.',
  authenticateWith: 'Menghubungkan ke %{pluginName}',
  authenticateWithTitle:
    'Silahkan mengotentifikasi menggunakan %{pluginName} untuk memilih berkas',
  back: 'Kembali',
  browse: 'Telusuri',
  browseFiles: 'Telusuri',
  cancel: 'Batal',
  cancelUpload: 'Batalkan pengungahan',
  closeModal: 'Tutup Modal',
  companionError: 'Koneksi ke Companion gagal',
  complete: 'Komplit',
  connectedToInternet: 'Terhubung ke Internet',
  copyLink: 'Salin tautan',
  copyLinkToClipboardFallback: 'Salin URL di bawah ini',
  copyLinkToClipboardSuccess: 'Tautan berhasil disalin ke Clipboard',
  creatingAssembly: 'Menyiapkan unggahan...',
  creatingAssemblyFailed: 'Transloadit: Tidak dapat membuat Assembly',
  dashboardTitle: 'Pengunggah Berkas',
  dashboardWindowTitle:
    'Jendela Pengunggah Berkas (Tekan escape untuk menutup)',
  dataUploadedOfTotal: '%{complete} dari %{total}',
  done: 'Selesai',
  dropHint: 'Letakkan berkas Anda di sini',
  dropPasteBoth: 'Letakkan berkas di sini, tempelkan atau %{browse}',
  dropPasteFiles: 'Letakkan berkas di sini, tempelkan atau %{browse}',
  dropPasteFolders: 'Letakkan berkas di sini, tempelkan atau %{browse}',
  dropPasteImportBoth: 'Letakkan berkas, tempelkan, %{browse} atau impor dari',
  dropPasteImportFiles: 'Letakkan berkas, tempelkan, %{browse} atau impor dari',
  dropPasteImportFolders:
    'Letakkan berkas, tempelkan, %{browse} atau impor dari',
  editFile: 'Ubah berkas',
  editImage: 'Edit gambar',
  editing: 'Mengubah %{file}',
  emptyFolderAdded: 'Tidak ada berkas yang ditambahkan dari direktori kosong',
  encoding: 'Pengkodean...',
  enterCorrectUrl:
    'URL salah: Mohon pastikan Anda memasukkan tautan langsung ke berkas',
  enterUrlToImport: 'Masukkan URL untuk mengimpor berkas',
  exceedsSize: 'Berkas ini melebihi ukuran maksimum yang dibolehkan %{size}',
  failedToFetch: 'Companion gagal mengambil URL ini, pastikan sudah benar',
  failedToUpload: 'Gagal mengunggah %{file}',
  fileSource: 'Sumber berkas: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} dari %{smart_count} berkas terunggah',
    '1': '%{complete} dari %{smart_count} berkas terunggah',
  },
  filter: 'Penyaring',
  finishEditingFile: 'Selesai mengubah berkas',
  folderAdded: {
    '0': 'Menambahkan %{smart_count} berkas dari %{folder}',
    '1': 'Menambahkan %{smart_count} berkas dari %{folder}',
  },
  import: 'Impor',
  importFrom: 'Impor dari %{name}',
  loading: 'Memuat...',
  logOut: 'Keluar',
  myDevice: 'Perangkat Saya',
  noFilesFound: 'Anda tidak memiliki berkas atau direktori di sini',
  noInternetConnection: 'Tidak ada koneksi Internet',
  openFolderNamed: 'Buka direktori %{name}',
  pause: 'Tunda',
  pauseUpload: 'Tunda pengungahan',
  paused: 'Ditunda',
  poweredBy: 'Didukung oleh %{uppy}',
  processingXFiles: {
    '0': 'Pemrosesan %{smart_count} berkas',
    '1': 'Pemrosesan %{smart_count} berkas',
  },
  removeFile: 'Hapus berkas',
  resetFilter: 'Setel ulang penyaring',
  resume: 'Lanjutkan',
  resumeUpload: 'Lanjutkan pengungahan',
  retry: 'Ulangi',
  retryUpload: 'Ulangi pengungahan',
  saveChanges: 'Simpan perubahan',
  selectFileNamed: 'Pilih berkas %{name}',
  selectX: {
    '0': 'Pilih %{smart_count}',
    '1': 'Pilih %{smart_count}',
  },
  smile: 'Senyum!',
  startRecording: 'Memulai perekaman video',
  stopRecording: 'Menghentikan perekaman video',
  takePicture: 'Mengambil gambar',
  timedOut: 'Pengunggahan terhenti untuk %{seconds} detik, membatalkan.',
  unselectFileNamed: 'Batalkan pemilihan berkas %{name}',
  upload: 'Unggah',
  uploadComplete: 'Pengunggahan selesai',
  uploadFailed: 'Pengunggahan gagal',
  uploadPaused: 'Pengunggahan ditunda',
  uploadXFiles: {
    '0': 'Unggah %{smart_count} berkas',
    '1': 'Unggah %{smart_count} berkas',
  },
  uploadXNewFiles: {
    '0': 'Mengunggah +%{smart_count} berkas baru',
    '1': 'Mengunggah +%{smart_count} berkas baru',
  },
  uploading: 'Mengunggah',
  uploadingXFiles: {
    '0': 'Mengunggah %{smart_count} berkas',
    '1': 'Mengunggah %{smart_count} berkas',
  },
  xFilesSelected: {
    '0': '%{smart_count} berkas terpilih',
    '1': '%{smart_count} berkas terpilih',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} berkas lagi ditambahkan',
    '1': '%{smart_count} berkas lagi ditambahkan',
  },
  xTimeLeft: 'Tersisa %{time}',
  youCanOnlyUploadFileTypes: 'Anda hanya dapat menggunggah: %{types}',
  youCanOnlyUploadX: {
    '0': 'Anda hanya dapat mengunggah %{smart_count} berkas',
    '1': 'Anda hanya dapat mengunggah %{smart_count} berkas',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Anda harus memilih minimal %{smart_count} berkas',
    '1': 'Anda harus memilih minimal %{smart_count} berkas',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.id_ID = id_ID
}

export default id_ID
