'use strict';

/* eslint camelcase: 0 */

var tr_TR = {};

tr_TR.strings = {
  chooseFile: 'Dosya Seçin',
  youHaveChosen: 'Seçmiş olduğun dosya: %{fileName}',
  orDragDrop: 'yada bırakın',
  filesChosen: {
    0: '%{smart_count} adet dosya seçili',
    1: '%{smart_count} adet dosyalar seçili'
  },
  filesUploaded: {
    0: '%{smart_count} adet dosya yüklendi',
    1: '%{smart_count} adet dosyalar yüklendi'
  },
  files: {
    0: '%{smart_count} dosya',
    1: '%{smart_count} dosyalar'
  },
  uploadFiles: {
    0: 'Yüklenen %{smart_count} dosya',
    1: 'Yüklenen %{smart_count} dosyalar'
  },
  selectToUpload: 'Yüklemek için dosyaları seçin',
  closeModal: 'Pencereyi Kapat',
  upload: 'Yükle',
  importFrom: 'Dosyaları içeri aktar',
  dashboardWindowTitle: 'Uppy Panel Pencerisi (kapatmak için esc kullanın)',
  dashboardTitle: 'Uppy Panel',
  copyLinkToClipboardSuccess: 'Bağlantı kopyalandı.',
  copyLinkToClipboardFallback: 'Bağlantıyı kopyala.',
  done: 'Bitti',
  localDisk: 'Lokal Dosyalar',
  dropPasteImport: 'Dosyaları buraya bırakın, yukarıdaki konumlardan birinden yapıştırın, içeri aktarın veya',
  dropPaste: 'Dosyaları buraya bırak, yapıştır veya',
  browse: 'Gözat',
  fileProgress: 'Dosya ilerlemesi: yükleme hızı ve süresi',
  numberOfSelectedFiles: 'Seçilen dosya sayısı',
  uploadAllNewFiles: 'Tüm yeni dosyaları yükle'
};

tr_TR.pluralize = function (n) {
  if (n === 1) {
    return 0;
  }
  return 1;
};

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.tr_TR = tr_TR;
}

module.exports = tr_TR;
//# sourceMappingURL=tr_TR.js.map