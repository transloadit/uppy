/* eslint camelcase: 0 */

const id_ID = {}

id_ID.strings = {
  chooseFile: 'Pilih berkas',
  youHaveChosen: 'Berkas yang dipilih: %{fileName}',
  orDragDrop: 'atau tarik dan taruh berkas ke sini',
  filesChosen: {
    0: '%{smart_count} berkas dipilih',
    1: '%{smart_count} berkas dipilih'
  },
  filesUploaded: {
    0: '%{smart_count} berkas terunggah',
    1: '%{smart_count} berkas terunggah'
  },
  files: {
    0: '%{smart_count} berkas',
    1: '%{smart_count} berkas'
  },
  uploadFiles: {
    0: 'Unggah %{smart_count} berkas',
    1: 'Unggah %{smart_count} berkas'
  },
  selectToUpload: 'Pilih berkas untuk mengunggah',
  closeModal: 'Tutup Modal',
  upload: 'Unggah',
  importFrom: 'Import berkas dari',
  dashboardWindowTitle: 'Uppy Beranda Window (Tekan escape untuk menutup)',
  dashboardTitle: 'Beranda Uppy',
  copyLinkToClipboardSuccess: 'Link tersalin.',
  copyLinkToClipboardFallback: 'Salin URL di bawah ini',
  done: 'Selesai',
  localDisk: 'Penyimpanan Lokal',
  dropPasteImport: 'Taruh berkas di sini, tempel, import dari salah satu lokasi di atas atau',
  dropPaste: 'Taruh berkas di sini, tempel atau',
  browse: 'cari',
  fileProgress: 'Proses berkas: kecepatan unggah dan ETA',
  numberOfSelectedFiles: 'Total berkas yang di pilih',
  uploadAllNewFiles: 'Unggah semua berkas baru'
}

id_ID.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.id_ID = id_ID
}

module.exports = id_ID
