import type { Locale } from '@uppy/utils'

const tr_TR: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

tr_TR.strings = {
  addMore: 'Daha ekle',
  addMoreFiles: 'Daha fazla dosya ekle',
  addingMoreFiles: 'Daha fazla dosya ekleniyor',
  allowAccessDescription:
    'Kameranızla fotoğraf çekmek veya video kaydetmek için lütfen erişim izni verin.',
  allowAccessTitle: 'Lütfen kameranıza erişim izni verin',
  authenticateWith: '%{pluginName} ile bağlan',
  authenticateWithTitle:
    'Lütfen dosyaları seçmek için %{pluginName} ile bağlanın',
  back: 'Geri',
  browse: 'gözat',
  browseFiles: 'gözat',
  cancel: 'İptal',
  cancelUpload: 'Yüklemeyi İptal Et',
  closeModal: 'Kapat',
  companionError: 'Bağlantı başarısız',
  complete: 'Yüklendi',
  connectedToInternet: 'İnternete bağlanıldı',
  copyLink: 'Linki kopyala',
  copyLinkToClipboardFallback: 'Aşağıdaki linki kopyala',
  copyLinkToClipboardSuccess: 'Link panoya kopyalandı',
  creatingAssembly: 'Yüklemeye hazırlanıyor...',
  creatingAssemblyFailed: 'Transloadit: Yükleme oluşturulamadı',
  dashboardTitle: 'Dosya Yükle',
  dashboardWindowTitle: 'Dosya Yükle (Kapatmak için Esc)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  done: 'Bitti',
  dropHint: 'Buraya sürükleyip bırakın',
  dropPasteBoth: 'Sürükleyip bırak, yapıştır veya %{browse}',
  dropPasteFiles: 'Sürükleyip bırak, yapıştır veya %{browse}',
  dropPasteFolders: 'Sürükleyip bırak, yapıştır veya %{browse}',
  dropPasteImportBoth: 'Sürükleyip bırak, yapıştır, %{browse} veya içeri aktar',
  dropPasteImportFiles:
    'Sürükleyip bırak, yapıştır, %{browse} veya içeri aktar',
  dropPasteImportFolders:
    'Sürükleyip bırak, yapıştır, %{browse} veya içeri aktar',
  editFile: 'Dosyayı düzenle',
  editImage: 'Resmi Düzenle',
  editing: '%{file} düzenleniyor',
  emptyFolderAdded: 'Klasör boş',
  encoding: 'Çözümleniyor...',
  enterCorrectUrl:
    'Hatalı URL: Lütfen bir dosyaya doğrudan bağlantı girdiğinizden emin olun.',
  enterUrlToImport: 'Dosya URL’sini buraya yapıştırın',
  exceedsSize: 'Bu dosya izin verilen maksimum boyutu aşıyor %{size}',
  failedToFetch: 'Bu URL’den alınamadı, lütfen doğru olduğundan emin olun',
  failedToUpload: '%{file} dosyası yüklenemedi',
  fileSource: 'Dosya kaynağı: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} / %{smart_count} dosya yüklendi',
    '1': '%{complete} / %{smart_count} dosya yüklendi',
  },
  filter: 'Filtre',
  finishEditingFile: 'Düzenlemeyi bitir',
  folderAdded: {
    '0': '%{folder} klasöründen %{smart_count} dosya eklendi',
    '1': '%{folder} klasöründen %{smart_count} dosya eklendi',
  },
  import: 'Ekle',
  importFrom: '%{name} Ekle',
  loading: 'Yükleniyor...',
  logOut: 'Çıkış',
  myDevice: 'Dosyalarım',
  noFilesFound: 'Dosya veya klasör bulunamadı',
  noInternetConnection: 'İnternet bağlantınız yok',
  pause: 'Durdur',
  pauseUpload: 'Yükleme Durdu',
  paused: 'Durdu',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': '%{smart_count} dosya işleniyor',
    '1': '%{smart_count} dosya işleniyor',
  },
  removeFile: 'Dosyayı kaldır',
  resetFilter: 'Filtreyi temizle',
  resume: 'Devam Et',
  resumeUpload: 'Yüklemeye devam et',
  retry: 'Tekrar',
  retryUpload: 'Tekrar yükle',
  saveChanges: 'Değişiklikleri kaydet',
  selectX: {
    '0': '%{smart_count} seç',
    '1': '%{smart_count} seç',
  },
  smile: 'Gülümse!',
  startRecording: 'Video kaydına başla',
  stopRecording: 'Video kaydını durdur',
  takePicture: 'Fotoğraf çek',
  timedOut:
    'Yükleme işlemi %{seconds} saniyeden fazla sürdüğü için iptal edildi.',
  upload: 'Yükle',
  uploadComplete: 'Yükleme tamamlandı',
  uploadFailed: 'Yükleme başarısız',
  uploadPaused: 'Yükleme durduruldu',
  uploadXFiles: {
    '0': '%{smart_count} dosyayı yükle',
    '1': '%{smart_count} dosyayı yükle',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} dosyayı yükle',
    '1': '+%{smart_count} dosyayı yükle',
  },
  uploading: 'Yükleniyor',
  uploadingXFiles: {
    '0': '%{smart_count} dosya yükleniyor',
    '1': '%{smart_count} dosya yükleniyor',
  },
  xFilesSelected: {
    '0': '%{smart_count} dosya seçildi',
    '1': '%{smart_count} dosya seçildi',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} dosya daha eklendi',
    '1': '%{smart_count} dosya daha eklendi',
  },
  xTimeLeft: 'kalan süre %{time}',
  youCanOnlyUploadFileTypes: 'Sadece %{types} yükleyebilirsiniz',
  youCanOnlyUploadX: {
    '0': 'Sadece %{smart_count} dosya yükleyebilirsiniz',
    '1': 'Sadece %{smart_count} dosya yükleyebilirsiniz',
  },
  youHaveToAtLeastSelectX: {
    '0': 'En az %{smart_count} dosya seçmelisin',
    '1': 'En az %{smart_count} dosya seçmelisin',
  },
  selectFileNamed: 'Dosya Seç %{name}',
  unselectFileNamed: 'Dosya seçimini kaldır %{name}',
  openFolderNamed: 'Açık dosya %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.tr_TR = tr_TR
}

export default tr_TR
