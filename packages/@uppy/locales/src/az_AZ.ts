import type { Locale } from '@uppy/core/utils'

const az_AZ: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

az_AZ.strings = {
  addBulkFilesFailed: {
    '0': 'Daxili xəta səbəbindən %{smart_count} fayl əlavə edilə bilmədi',
    '1': 'Daxili xətalar səbəbindən %{smart_count} fayl əlavə edilə bilmədi',
  },
  addedNumFiles: '%{numFiles} fayl əlavə edildi',
  addingMoreFiles: 'Daha çox fayl əlavə edilir',
  additionalRestrictionsFailed: '%{count} əlavə məhdudiyyət yerinə yetirilmədi',
  addMore: 'Daha çox əlavə et',
  addMoreFiles: 'Daha çox fayl əlavə et',
  aggregateExceedsSize:
    'Siz %{size} həcmində fayl seçdiniz, lakin icazə verilən maksimum həcm: %{sizeAllowed}',
  allFilesFromFolderNamed: '%{name} qovluğundan bütün fayllar',
  allowAccessDescription:
    'Kameranızla foto çəkmək və ya video yazmaq üçün bu sayta kameraya giriş icazəsi verin.',
  allowAccessTitle: 'Zəhmət olmasa kameranıza giriş icazəsi verin',
  allowAudioAccessDescription:
    'Səs yazmaq üçün bu sayta mikrofona giriş icazəsi verin.',
  allowAudioAccessTitle: 'Zəhmət olmasa mikrofonunuza giriş icazəsi verin',
  aspectRatioLandscape: 'Albom formatında kəs (16:9)',
  aspectRatioPortrait: 'Portret formatında kəs (9:16)',
  aspectRatioSquare: 'Kvadrat formatında kəs',
  authAborted: 'Doğrulama ləğv edildi',
  authenticate: 'Qoşul',
  authenticateWith: '%{pluginName}-a qoşul',
  authenticateWithTitle:
    'Faylları seçmək üçün %{pluginName} ilə doğrulama edin',
  back: 'Geri',
  browse: 'seçin',
  browseFiles: 'faylları seçin',
  browseFolders: 'qovluqları seçin',
  cancel: 'Ləğv et',
  cancelUpload: 'Yükləməni ləğv et',
  closeModal: 'Pəncərəni bağla',
  companionError: 'Companion ilə əlaqə uğursuz oldu',
  companionUnauthorizeHint:
    '%{provider} hesabınızın icazəsini ləğv etmək üçün %{url} ünvanına keçin',
  complete: 'Tamamlandı',
  compressedX: 'Şəkilləri sıxaraq %{size} qənaət edildi',
  compressingImages: 'Şəkillər sıxılır...',
  connectedToInternet: 'İnternetə qoşulub',
  copyLink: 'Keçidi kopyala',
  copyLinkToClipboardFallback: 'Aşağıdakı keçidi kopyalayın',
  copyLinkToClipboardSuccess: 'Keçid mübadilə buferinə kopyalandı.',
  creatingAssembly: 'Yükləmə hazırlanır...',
  creatingAssemblyFailed: 'Transloadit: Assembly yaradıla bilmədi',
  dashboardTitle: 'Uppy İdarə Paneli',
  dashboardWindowTitle:
    'Uppy İdarə Paneli Pəncərəsi (Bağlamaq üçün Escape düyməsini basın)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  dataUploadedOfUnknown: '%{complete} / naməlum',
  discardMediaFile: 'Mediadan imtina et',
  discardRecordedFile: 'Yazılmış fayldan imtina et',
  done: 'Hazırdır',
  dropHereOr: 'Buraya buraxın və ya %{browse}',
  dropHint: 'Fayllarınızı buraya buraxın',
  dropPasteBoth:
    'Faylları buraya buraxın, %{browseFiles} və ya %{browseFolders}',
  dropPasteFiles: 'Faylları buraya buraxın və ya %{browseFiles}',
  dropPasteFolders: 'Faylları buraya buraxın və ya %{browseFolders}',
  dropPasteImportBoth:
    'Faylları buraya buraxın, %{browseFiles}, %{browseFolders} və ya buradan idxal edin:',
  dropPasteImportFiles:
    'Faylları buraya buraxın, %{browseFiles} və ya buradan idxal edin:',
  dropPasteImportFolders:
    'Faylları buraya buraxın, %{browseFolders} və ya buradan idxal edin:',
  editFile: 'Faylı redaktə et',
  editFileWithFilename: '%{file} faylını redaktə et',
  editImage: 'Şəkli redaktə et',
  editing: '%{file} redaktə edilir',
  emptyFolderAdded: 'Boş qovluqdan heç bir fayl əlavə edilmədi',
  encoding: 'Kodlaşdırılır...',
  enterCorrectUrl:
    'Yanlış URL: Zəhmət olmasa, birbaşa fayl keçidi daxil etdiyinizə əmin olun',
  enterTextToSearch: 'Şəkil axtarmaq üçün mətn daxil edin',
  enterUrlToImport: 'Fayl idxal etmək üçün URL daxil edin',
  error: 'Xəta',
  exceedsSize: '%{file} icazə verilən maksimum %{size} həcmini aşır',
  failedToAddFiles: 'Fayllar əlavə edilmədi',
  failedToFetch:
    'Companion bu URL-i əldə edə bilmədi, zəhmət olmasa düzgün olduğuna əmin olun',
  failedToUpload: '%{file} yüklənmədi',
  filesUploadedOfTotal: {
    '0': '%{complete} / %{smart_count} fayl yükləndi',
    '1': '%{complete} / %{smart_count} fayl yükləndi',
  },
  filter: 'Süzgəc',
  finishEditingFile: 'Faylın redaktəsini bitir',
  flipHorizontal: 'Üfüqi çevir',
  folderAdded: {
    '0': '%{folder} qovluğundan %{smart_count} fayl əlavə edildi',
    '1': '%{folder} qovluğundan %{smart_count} fayl əlavə edildi',
  },
  folderAlreadyAdded: 'Qovluq "%{folder}" artıq əlavə edilib',
  generateImage: 'Şəkil yarat',
  generateImagePlaceholder:
    'Dağ gölü üzərində sakit gün batımı, suda əks olunan şam ağacları',
  generating1: 'AI düşünür...',
  generating2: 'Piksellər emal edilir...',
  generating3: 'Şəkillər yaradılır...',
  generating4: 'AI işləyir...',
  generating5: 'Sehr yaradılır...',
  generatingThumbnails: 'Miniatürlər yaradılır...',
  import: 'İdxal et',
  importFiles: 'Faylları buradan idxal edin:',
  importFrom: '%{name}-dan idxal et',
  inferiorSize: 'Bu fayl icazə verilən %{size} həcmindən kiçikdir',
  loadedXFiles: '%{numFiles} fayl yükləndi',
  loading: 'Yüklənir...',
  logIn: 'Daxil ol',
  logOut: 'Çıxış et',
  micDisabled: 'İstifadəçi mikrofona girişi rədd etdi',
  missingRequiredMetaField: 'Tələb olunan meta sahələr çatışmır',
  missingRequiredMetaFieldOnFile:
    '%{fileName} faylında tələb olunan meta sahələr çatışmır',
  missingRequiredMetaFields: {
    '0': 'Tələb olunan meta sahə çatışmır: %{fields}.',
    '1': 'Tələb olunan meta sahələr çatışmır: %{fields}.',
  },
  myDevice: 'Mənim Cihazım',
  noAudioDescription:
    'Səs yazmaq üçün mikrofon və ya başqa audio giriş cihazı qoşun',
  noAudioTitle: 'Mikrofon Əlçatan Deyil',
  noCameraDescription: 'Foto çəkmək və ya video yazmaq üçün kamera qoşun',
  noCameraTitle: 'Kamera Əlçatan Deyil',
  noDuplicates: "Təkrar fayl '%{fileName}' əlavə edilə bilməz, artıq mövcuddur",
  noFilesFound: 'Burada heç bir fayl və ya qovluğunuz yoxdur',
  noInternetConnection: 'İnternet bağlantısı yoxdur',
  noMoreFilesAllowed: 'Daha çox fayl əlavə edilə bilməz',
  noSearchResults: 'Təəssüf ki, bu axtarış üçün nəticə yoxdur',
  openFolderNamed: '%{name} qovluğunu aç',
  pause: 'Fasilə ver',
  paused: 'Fasilədədir',
  pauseUpload: 'Yükləməyə fasilə ver',
  pickFiles: 'Faylları seç',
  pickPhotos: 'Fotoları seç',
  pleaseWait: 'Zəhmət olmasa gözləyin',
  pluginNameAudio: 'Səs',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Kamera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameGoogleDrivePicker: 'Google Drive',
  pluginNameGooglePhotosPicker: 'Google Photos',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Ekran yazısı',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Keçid',
  pluginNameWebdav: 'WebDAV',
  pluginNameZoom: 'Zoom',
  pluginWebdavInputLabel:
    'Fayl üçün WebDAV URL-i (məsələn, ownCloud və ya Nextcloud-dan)',
  poweredBy: '%{uppy} tərəfindən dəstəklənir',
  processingXFiles: {
    '0': '%{smart_count} fayl emal edilir',
    '1': '%{smart_count} fayl emal edilir',
  },
  recording: 'Yazılır',
  recordingLength: 'Yazının uzunluğu %{recording_length}',
  recordingStoppedMaxSize: 'Fayl həcmi limiti aşacağı üçün yazı dayandırıldı',
  recordVideoBtn: 'Video Yaz',
  recoveredAllFiles:
    'Bütün faylları bərpa etdik. İndi yükləməni davam etdirə bilərsiniz.',
  recoveredXFiles: {
    '0': '%{smart_count} faylı tam bərpa edə bilmədik. Zəhmət olmasa onu yenidən seçib yükləməni davam etdirin.',
    '1': '%{smart_count} faylı tam bərpa edə bilmədik. Zəhmət olmasa onları yenidən seçib yükləməni davam etdirin.',
  },
  removeFile: 'Faylı çıxar',
  reSelect: 'Yenidən seç',
  resetFilter: 'Süzgəci sıfırla',
  resetSearch: 'Axtarışı sıfırla',
  resume: 'Davam et',
  resumeUpload: 'Yükləməni davam etdir',
  retry: 'Yenidən cəhd et',
  retryUpload: 'Yükləməni yenidən cəhd et',
  revert: 'Sıfırla',
  rotate: '90° Döndər',
  save: 'Yadda saxla',
  saveChanges: 'Dəyişiklikləri yadda saxla',
  search: 'Axtarış',
  searchImages: 'Şəkillər axtar',
  selectX: {
    '0': '%{smart_count} seç',
    '1': '%{smart_count} seç',
  },
  sessionRestored: 'Sessiya bərpa edildi',
  showErrorDetails: 'Xəta təfərrüatlarını göstər',
  signInWithGoogle: 'Google ilə daxil ol',
  smile: 'Gülümsəyin!',
  startAudioRecording: 'Səs yazısına başla',
  startCapturing: 'Ekran yazısına başla',
  startRecording: 'Video yazısına başla',
  stopAudioRecording: 'Səs yazısını dayandır',
  stopCapturing: 'Ekran yazısını dayandır',
  stopRecording: 'Video yazısını dayandır',
  streamActive: 'Yayım aktivdir',
  streamPassive: 'Yayım passivdir',
  submitRecordedFile: 'Yazılmış faylı göndər',
  takePicture: 'Şəkil çək',
  takePictureBtn: 'Şəkil Çək',
  takeScreenshot: 'Ekran Görüntüsü Al',
  unnamed: 'Adsız',
  upload: 'Yüklə',
  uploadComplete: 'Yükləmə tamamlandı',
  uploadFailed: 'Yükləmə uğursuz oldu',
  uploading: 'Yüklənir',
  uploadingXFiles: {
    '0': '%{smart_count} fayl yüklənir',
    '1': '%{smart_count} fayl yüklənir',
  },
  uploadPaused: 'Yükləmə fasilədədir',
  uploadStalled:
    'Yükləmə %{seconds} saniyədir irəliləmir. Yenidən cəhd etmək istəyə bilərsiniz.',
  uploadXFiles: {
    '0': '%{smart_count} faylı yüklə',
    '1': '%{smart_count} faylı yüklə',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} faylı yüklə',
    '1': '+%{smart_count} faylı yüklə',
  },
  xFilesSelected: {
    '0': '%{smart_count} fayl seçildi',
    '1': '%{smart_count} fayl seçildi',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} fayl daha əlavə edildi',
    '1': '%{smart_count} fayl daha əlavə edildi',
  },
  xTimeLeft: '%{time} qalıb',
  youCanOnlyUploadFileTypes: 'Yalnız bunları yükləyə bilərsiniz: %{types}',
  youCanOnlyUploadX: {
    '0': 'Yalnız %{smart_count} fayl yükləyə bilərsiniz',
    '1': 'Yalnız %{smart_count} fayl yükləyə bilərsiniz',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Ən azı %{smart_count} fayl seçməlisiniz',
    '1': 'Ən azı %{smart_count} fayl seçməlisiniz',
  },
  zoomIn: 'Yaxınlaşdır',
  zoomOut: 'Uzaqlaşdır',
}

// @ts-expect-error untyped
if (typeof Uppy !== 'undefined') {
  // @ts-expect-error untyped
  globalThis.Uppy.locales.az_AZ = az_AZ
}

export default az_AZ
