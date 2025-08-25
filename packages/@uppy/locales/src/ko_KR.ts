import type { Locale } from '@uppy/utils'

const ko_KR: Locale<0> = {
  strings: {},
  pluralize() {
    return 0
  },
}

ko_KR.strings = {
  addMore: '파일 추가',
  addMoreFiles: '파일 추가',
  addingMoreFiles: '파일 추가 중',
  allowAccessDescription:
    '카메라를 이용해 사진이나 영상을 찍기 위해서 이 사이트의 카메라 접근 권한을 허용해 주세요.',
  allowAccessTitle: '카메라 사용 권한을 허용해 주세요.',
  authenticateWith: '%{pluginName} 연결',
  authenticateWithTitle: '파일을 선택하기 위해 %{pluginName}에 연결해 주세요.',
  back: '뒤로',
  browse: '선택',
  browseFiles: '파일 선택',
  browseFolders: '폴더 선택',
  cancel: '취소',
  cancelUpload: '업로드 취소',
  closeModal: '창 닫기',
  companionError: '연결 실패',
  companionUnauthorizeHint:
    '%{provider} 연결 해제를 원하시면 %{url}에 방문하세요',
  complete: '완료',
  connectedToInternet: '인터넷에 연결됨',
  copyLink: '링크 복사',
  copyLinkToClipboardFallback: '아래 URL을 복사하세요',
  copyLinkToClipboardSuccess: '링크가 클립보드에 저장됨',
  creatingAssembly: '업로드 준비 중...',
  creatingAssemblyFailed: 'Transloadit: 업로드를 생성할 수 없음',
  dashboardTitle: '파일 업로더',
  dashboardWindowTitle: '파일 업로더 창 (ESC를 누르면 닫힙니다.)',
  dataUploadedOfTotal: '%{complete} / %{total}',
  done: '완료',
  dropHint: '여기에 파일을 드래그 앤 드롭 해주세요.',
  dropPasteBoth:
    '여기에 파일을 드래그 앤 드롭 하거나, %{browseFiles}, %{browseFolders}',
  dropPasteFiles: '여기에 파일을 드래그 앤 드롭 하거나, %{browseFiles}',
  dropPasteFolders: '여기에 파일을 드래그 앤 드롭 하거나, %{browseFolders}',
  dropPasteImportBoth:
    '여기에 파일을 드래그 앤 드롭 하거나, %{browseFiles}, %{browseFolders}, 이 경로에서 입수 :',
  dropPasteImportFiles:
    '여기에 파일을 드래그 앤 드롭 하거나, %{browseFiles}, 이 경로에서 입수 :',
  dropPasteImportFolders:
    '여기에 파일을 드래그 앤 드롭 하거나, %{browseFolders}, 이 경로에서 입수 :',
  editFile: '파일 수정',
  editImage: '이미지 수정',
  editing: '%{file} 수정 중',
  emptyFolderAdded: '빈 폴더입니다.',
  encoding: '인코딩 중...',
  enterCorrectUrl: '옳지 않은 URL: 파일 주소를 확인해 주세요.',
  enterUrlToImport: '파일 URL을 입력해 주세요.',
  exceedsSize: '업로드 허용 용량 초과 %{size}',
  failedToFetch: 'URL 가져오기 실패. 주소를 확인해 주세요.',
  failedToUpload: '%{file} 업로드 실패',
  fileSource: '파일 소스: %{name}',
  filesUploadedOfTotal: '%{complete} / %{smart_count} 완료됨',
  filter: '필터',
  finishEditingFile: '파일 수정을 완료하세요.',
  folderAdded: '%{folder}에서 파일 %{smart_count}개 추가',
  generatingThumbnails: '썸네일 생성 중...',
  import: '가져오기',
  importFrom: '%{name}에서 가져오기',
  loading: '불러오는 중...',
  logOut: '로그아웃',
  myDevice: '내 기기',
  noFilesFound: '파일이나 폴더가 없음',
  noInternetConnection: '인터넷 연결 안 됨',
  openFolderNamed: '%{name} 폴더 열기',
  pause: '일시정지',
  pauseUpload: '업로드 일시정지',
  paused: '일시정지 됨',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: '%{smart_count}개의 파일 처리 중',
  removeFile: '파일 제거',
  resetFilter: '필터 초기화',
  resume: '재개',
  resumeUpload: '업로드 재개',
  retry: '재시도',
  retryUpload: '업로드 재시도',
  saveChanges: '변경사항 저장',
  selectFileNamed: '%{name} 파일 선택',
  selectX: '%{smart_count}개 선택',
  smile: 'Smile!',
  startRecording: '비디오 녹화 시작',
  stopRecording: '비디오 녹화 정지',
  takePicture: '사진 촬영',
  timedOut: '%{seconds}초 동안 업로드 정지되어 업로드를 취소합니다.',
  unselectFileNamed: '%{name} 파일 선택 해제',
  upload: '업로드',
  uploadComplete: '업로드 완료',
  uploadFailed: '업로드 실패',
  uploadPaused: '업로드 정지됨',
  uploadXFiles: '%{smart_count}개의 파일 업로드',
  uploadXNewFiles: '+%{smart_count}개의 파일 업로드',
  uploading: '업로드 중',
  uploadingXFiles: '%{smart_count}개의 파일 업로드 중',
  xFilesSelected: '%{smart_count}개의 파일 선택됨',
  xMoreFilesAdded: '%{smart_count}개의 파일이 더 추가 됨',
  xTimeLeft: '%{time} 남음',
  youCanOnlyUploadFileTypes: '업로드 가능 형식: %{types}',
  youCanOnlyUploadX: '%{smart_count}개의 파일만 업로드할 수 있습니다',
  youHaveToAtLeastSelectX: '최소 %{smart_count}개의 파일을 선택해야 합니다',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ko_KR = ko_KR
}

export default ko_KR
