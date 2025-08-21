import type { Locale } from '@uppy/utils'

const vi_VN: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

vi_VN.strings = {
  addBulkFilesFailed: {
    '0': 'Không thể thêm %{smart_count} tệp do lỗi nội bộ',
    '1': 'Không thể thêm %{smart_count} tệp do lỗi nội bộ',
  },
  addedNumFiles: 'Đã thêm %{numFiles} tệp',
  addingMoreFiles: 'Đang thêm tệp',
  additionalRestrictionsFailed: '%{count} ràng buộc bổ sung không được đáp ứng',
  addMore: 'Thêm',
  addMoreFiles: 'Thêm tệp',
  allFilesFromFolderNamed: 'Tất cả tệp từ thư mục %{name}',
  allowAccessDescription:
    'Để chụp ảnh hoặc quay video bằng máy ảnh của bạn, vui lòng cho phép truy cập máy ảnh cho trang web này.',
  allowAccessTitle: 'Vui lòng cho phép truy cập máy ảnh của bạn',
  allowAudioAccessDescription:
    'Để ghi âm, vui lòng cho phép truy cập microphone cho trang web này.',
  allowAudioAccessTitle: 'Vui lòng cho phép truy cập microphone của bạn',
  aspectRatioLandscape: 'Cắt ảnh ngang (16:9)',
  aspectRatioPortrait: 'Cắt ảnh dọc (9:16)',
  aspectRatioSquare: 'Cắt ảnh vuông',
  authAborted: 'Xác thực đã bị hủy',
  authenticateWith: 'Kết nối với %{pluginName}',
  authenticateWithTitle: 'Vui lòng xác thực với %{pluginName} để chọn tệp',
  back: 'Quay lại',
  browse: 'Duyệt',
  browseFiles: 'Duyệt tệp',
  browseFolders: 'Duyệt thư mục',
  cancel: 'Hủy',
  cancelUpload: 'Hủy tải lên',
  closeModal: 'Đóng cửa sổ',
  companionError: 'Kết nối thất bại',
  companionUnauthorizeHint:
    'Để hủy ủy quyền tài khoản %{provider} của bạn, vui lòng truy cập %{url}',
  complete: 'Hoàn thành',
  compressedX: 'Tiết kiệm %{size} bằng cách nén ảnh',
  compressingImages: 'Đang nén ảnh...',
  connectedToInternet: 'Đã kết nối với Internet',
  copyLink: 'Sao chép liên kết',
  copyLinkToClipboardFallback: 'Sao chép URL bên dưới',
  copyLinkToClipboardSuccess: 'Liên kết đã được sao chép vào clipboard.',
  creatingAssembly: 'Đang chuẩn bị tải lên...',
  creatingAssemblyFailed: 'Transloadit: Không thể tạo Assembly',
  dashboardTitle: 'Bảng điều khiển Uppy',
  dashboardWindowTitle: 'Cửa sổ Bảng điều khiển Uppy (Nhấn Esc để đóng)',
  dataUploadedOfTotal: '%{complete} trên %{total}',
  discardRecordedFile: 'Hủy tệp đã ghi âm',
  done: 'Hoàn tất',
  dropHint: 'Kéo và thả tệp của bạn vào đây',
  dropPasteBoth: 'Kéo và thả tệp vào đây, %{browseFiles} hoặc %{browseFolders}',
  dropPasteFiles: 'Kéo và thả tệp vào đây hoặc %{browseFiles}',
  dropPasteFolders: 'Kéo và thả tệp vào đây hoặc %{browseFolders}',
  dropPasteImportBoth:
    'Kéo và thả tệp vào đây, %{browseFiles}, %{browseFolders} hoặc nhập từ:',
  dropPasteImportFiles: 'Kéo và thả tệp vào đây, %{browseFiles} hoặc nhập từ:',
  dropPasteImportFolders:
    'Kéo và thả tệp vào đây, %{browseFolders} hoặc nhập từ:',
  editFile: 'Chỉnh sửa tệp',
  editImage: 'Chỉnh sửa ảnh',
  editFileWithFilename: 'Chỉnh sửa tệp %{file}',
  editing: 'Đang chỉnh sửa %{file}',
  emptyFolderAdded: 'Không có tệp nào được thêm từ thư mục trống',
  encoding: 'Đang mã hóa...',
  enterCorrectUrl:
    'URL không chính xác: Vui lòng đảm bảo bạn nhập một liên kết trực tiếp đến tệp',
  enterTextToSearch: 'Nhập văn bản để tìm kiếm ảnh',
  enterUrlToImport: 'Nhập URL để nhập tệp',
  error: 'Lỗi',
  exceedsSize: '%{file} vượt quá kích thước tối đa cho phép là %{size}',
  failedToFetch:
    'Companion không thể truy xuất URL này, vui lòng đảm bảo nó chính xác',
  failedToUpload: 'Không thể tải lên %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} trong số %{smart_count} tệp tin đã được tải lên',
    '1': '%{complete} trong số %{smart_count} tệp tin đã được tải lên',
  },
  filter: 'Bộ lọc',
  finishEditingFile: 'Hoàn thành chỉnh sửa tệp',
  flipHorizontal: 'Lật ngang',
  folderAdded: {
    '0': 'Đã thêm %{smart_count} tệp từ %{folder}',
    '1': 'Đã thêm %{smart_count} tệp từ %{folder}',
  },
  folderAlreadyAdded: 'Thư mục "%{folder}" đã được thêm trước đó',
  generatingThumbnails: 'Đang tạo hình thu nhỏ...',
  import: 'Nhập',
  importFiles: 'Nhập tệp từ:',
  importFrom: 'Nhập từ %{name}',
  inferiorSize: 'Tệp này nhỏ hơn kích thước tối đa cho phép là %{size}',
  loadedXFiles: 'Đã tải %{numFiles} tệp',
  loading: 'Đang tải...',
  logOut: 'Đăng xuất',
  micDisabled: 'Người dùng đã từ chối truy cập microphone',
  missingRequiredMetaField: 'Thiếu trường meta bắt buộc',
  missingRequiredMetaFieldOnFile:
    'Thiếu trường meta bắt buộc trong %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Thiếu trường meta bắt buộc: %{fields}.',
    '1': 'Thiếu trường meta bắt buộc: %{fields}.',
  },
  myDevice: 'Thiết bị của tôi',
  noAudioDescription:
    'Để ghi âm, vui lòng kết nối microphone hoặc thiết bị âm thanh khác',
  noAudioTitle: 'Microphone không khả dụng',
  noCameraDescription:
    'Để chụp ảnh hoặc quay video, vui lòng kết nối thiết bị máy ảnh',
  noCameraTitle: 'Máy ảnh không khả dụng',
  noDuplicates: "Không thể thêm tệp trùng lặp '%{fileName}', nó đã tồn tại",
  noFilesFound: 'Bạn không có tệp hoặc thư mục nào ở đây',
  noInternetConnection: 'Không có kết nối Internet',
  noMoreFilesAllowed: 'Không thể thêm tệp nữa',
  noSearchResults: 'Rất tiếc, không có kết quả cho tìm kiếm này',
  openFolderNamed: 'Mở thư mục %{name}',
  pause: 'Tạm dừng',
  paused: 'Đã tạm dừng',
  pauseUpload: 'Tạm dừng tải lên',
  pluginNameAudio: 'Âm thanh',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Máy ảnh',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameZoom: 'Zoom',
  poweredBy: 'Được cung cấp bởi %{uppy}',
  processingXFiles: {
    '0': 'Đang xử lý %{smart_count} tệp',
    '1': 'Đang xử lý %{smart_count} tệp',
  },
  recording: 'Đang ghi âm',
  recordingLength: 'Thời lượng ghi âm %{recording_length}',
  recordingStoppedMaxSize:
    'Ghi âm đã dừng vì kích thước tệp sắp vượt quá giới hạn',
  recordVideoBtn: 'Quay video',
  recoveredAllFiles:
    'Chúng tôi đã khôi phục tất cả các tệp. Bạn có thể tiếp tục tải lên.',
  recoveredXFiles: {
    '0': 'Chúng tôi không thể khôi phục hoàn toàn 1 tệp. Vui lòng chọn lại nó và tiếp tục tải lên.',
    '1': 'Chúng tôi không thể khôi phục hoàn toàn %{smart_count} tệp. Vui lòng chọn lại chúng và tiếp tục tải lên.',
  },
  removeFile: 'Xóa tệp',
  reSelect: 'Chọn lại',
  resetFilter: 'Đặt lại bộ lọc',
  resetSearch: 'Đặt lại tìm kiếm',
  resume: 'Tiếp tục',
  resumeUpload: 'Tiếp tục tải lên',
  retry: 'Thử lại',
  retryUpload: 'Thử lại tải lên',
  revert: 'Phục hồi',
  rotate: 'Xoay',
  save: 'Lưu',
  saveChanges: 'Lưu thay đổi',
  search: 'Tìm kiếm',
  searchImages: 'Tìm kiếm ảnh',
  selectX: {
    '0': 'Chọn %{smart_count}',
    '1': 'Chọn %{smart_count}',
  },
  sessionRestored: 'Khôi phục phiên',
  showErrorDetails: 'Hiển thị chi tiết lỗi',
  signInWithGoogle: 'Đăng nhập bằng Google',
  smile: 'Cười!',
  startAudioRecording: 'Bắt đầu ghi âm âm thanh',
  startCapturing: 'Bắt đầu chụp màn hình',
  startRecording: 'Bắt đầu ghi âm video',
  stopAudioRecording: 'Dừng ghi âm âm thanh',
  stopCapturing: 'Dừng chụp màn hình',
  stopRecording: 'Dừng ghi âm video',
  streamActive: 'Luồng hoạt động',
  streamPassive: 'Luồng chờ',
  submitRecordedFile: 'Gửi tệp đã ghi âm',
  takePicture: 'Chụp ảnh',
  takePictureBtn: 'Chụp ảnh',
  timedOut: 'Tải lên bị trì hoãn trong %{seconds} giây, đang hủy bỏ.',
  upload: 'Tải lên',
  uploadComplete: 'Tải lên hoàn tất',
  uploadFailed: 'Tải lên thất bại',
  uploading: 'Đang tải lên',
  uploadingXFiles: {
    '0': 'Đang tải lên %{smart_count} tệp',
    '1': 'Đang tải lên %{smart_count} tệp',
  },
  uploadPaused: 'Tải lên đã tạm dừng',
  uploadStalled:
    'Tải lên không tiến triển trong %{seconds} giây. Bạn có thể thử lại.',
  uploadXFiles: {
    '0': 'Tải lên %{smart_count} tệp',
    '1': 'Tải lên %{smart_count} tệp',
  },
  uploadXNewFiles: {
    '0': 'Tải lên +%{smart_count} tệp',
    '1': 'Tải lên +%{smart_count} tệp',
  },
  xFilesSelected: {
    '0': 'Đã chọn %{smart_count} tệp',
    '1': 'Đã chọn %{smart_count} tệp',
  },
  xMoreFilesAdded: {
    '0': 'Thêm %{smart_count} tệp',
    '1': 'Thêm %{smart_count} tệp',
  },
  xTimeLeft: 'Còn lại %{time}',
  youCanOnlyUploadFileTypes: 'Bạn chỉ có thể tải lên: %{types}',
  youCanOnlyUploadX: {
    '0': 'Bạn chỉ có thể tải lên %{smart_count} tệp',
    '1': 'Bạn chỉ có thể tải lên %{smart_count} tệp',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Bạn phải chọn ít nhất %{smart_count} tệp',
    '1': 'Bạn phải chọn ít nhất %{smart_count} tệp',
  },
  zoomIn: 'Phóng to',
  zoomOut: 'Thu nhỏ',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.vi_VN = vi_VN
}

export default vi_VN
