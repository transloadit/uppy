import type { Locale } from '@uppy/utils'

const ja_JP: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

ja_JP.strings = {
  addMore: 'さらに追加',
  addMoreFiles: 'ファイルを追加',
  addingMoreFiles: 'ファイルを追加しています',
  allowAccessDescription:
    'カメラやビデオの機能を使用するには、カメラへのアクセスを許可してください。',
  allowAccessTitle: 'カメラへのアクセスを許可してください',
  authenticateWith: '%{pluginName}に接続します',
  authenticateWithTitle:
    'ファイルを選択するには%{pluginName}で認証してください',
  back: '戻る',
  browse: '参照',
  browseFiles: '参照',
  cancel: 'キャンセル',
  cancelUpload: 'アップロードをキャンセル',
  closeModal: 'モーダルを閉じる',
  companionError: 'Companionとの接続に失敗しました',
  complete: '完了しました',
  compressingImages: '画像を圧縮中...',
  compressedX: '画像圧縮により%{size}を節約しました',
  connectedToInternet: 'インターネットに接続しました',
  copyLink: 'リンクをコピー',
  copyLinkToClipboardFallback: '以下のURLをコピー',
  copyLinkToClipboardSuccess: 'リンクをクリップボードにコピーしました',
  creatingAssembly: 'アップロードの準備をしています...',
  creatingAssemblyFailed: 'Transloadit: アセンブリを作成できませんでした',
  dashboardTitle: 'ファイルアップローダー',
  dashboardWindowTitle:
    'ファイルアップローダーウィンドウ（閉じるにはEscapeキーを押してください）',
  dataUploadedOfTotal: '%{total} %{complete}',
  done: '完了しました',
  dropHint: 'ここにファイルをドロップしてください',
  dropPasteBoth:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}してください',
  dropPasteFiles:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}してください',
  dropPasteFolders:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}してください',
  dropPasteImportBoth:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}するか、以下からインポートしてください',
  dropPasteImportFiles:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}するか、以下からインポートしてください',
  dropPasteImportFolders:
    'ここにファイルをドロップするか、貼り付けるか、%{browse}するか、以下からインポートしてください',
  editFile: 'ファイルを編集',
  editImage: '画像を編集',
  editing: '%{file}を編集しています',
  emptyFolderAdded: 'フォルダが空なためファイルが追加されませんでした',
  encoding: 'エンコードしています...',
  enterCorrectUrl:
    '不正なURL: ファイルへの直接リンクが入力されていることを確認してください',
  enterUrlToImport: 'ファイルをインポートするためのURLを入力してください',
  exceedsSize: 'ファイルサイズが大きすぎます %{size}',
  failedToFetch:
    'CompanionがURLを取得できませんでした。URLが正しいか確認してください',
  failedToUpload: '%{file}のアップロードに失敗しました',
  fileSource: '元ファイル：%{name}',
  filesUploadedOfTotal: {
    '0': '%{smart_count} 個のファイルのアップロードが%{complete}',
    '1': '%{smart_count} 個のファイルのアップロードが%{complete}',
  },
  filter: 'フィルタ',
  finishEditingFile: 'ファイルの編集を終了',
  folderAdded: {
    '0': '%{folder} から% {smart_count} 個のファイルを追加しました',
    '1': '%{folder} から% {smart_count} 個のファイルを追加しました',
  },
  import: 'インポート',
  importFrom: '%{name}からインポート',
  loading: 'ロード中...',
  logOut: 'ログアウト',
  myDevice: 'マイデバイス',
  noFilesFound: 'ファイルやフォルダがありません',
  noInternetConnection: 'インターネット接続がありません',
  pause: '一時停止',
  pauseUpload: 'アップロードを一時停止',
  paused: '停止中',
  poweredBy: 'Powered by %{uppy}',
  processingXFiles: {
    '0': '%{smart_count} ファイル処理中',
    '1': '%{smart_count} ファイル処理中',
  },
  removeFile: 'ファイルを消す',
  resetFilter: 'フィルタをリセット',
  resume: '再開',
  resumeUpload: 'アップロードを再開',
  retry: 'リトライ',
  retryUpload: 'アップロードをリトライ',
  saveChanges: '変更を保存',
  selectX: {
    '0': '%{smart_count} を選択',
    '1': '%{smart_count} を選択',
  },
  smile: 'スマイル〜！',
  startRecording: '録画開始',
  stopRecording: '録画停止',
  takePicture: '写真を撮る',
  timedOut: 'アップロードが %{seconds} 秒間止まった為中断しました',
  upload: 'アップロード',
  uploadComplete: 'アップロード完了',
  uploadFailed: 'アップロード失敗',
  uploadPaused: 'アップロード一時停止',
  uploadXFiles: {
    '0': '%{smart_count} ファイルをアップロード',
    '1': '%{smart_count} ファイルをアップロード',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} ファイルをアップロード',
    '1': '+%{smart_count} ファイルをアップロード',
  },
  uploading: 'アップロード中',
  uploadingXFiles: {
    '0': '%{smart_count} ファイルアップロード中',
    '1': '%{smart_count} ファイルアップロード中',
  },
  xFilesSelected: {
    '0': '%{smart_count} ファイルを選択',
    '1': '%{smart_count} ファイルを選択',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} ファイルを追加',
    '1': '%{smart_count} ファイルを追加',
  },
  xTimeLeft: '残り %{time}',
  youCanOnlyUploadFileTypes: '許可されているファイル形式は次の物です: %{types}',
  youCanOnlyUploadX: {
    '0': '%{smart_count} ファイル数のみアップロード可能です',
    '1': '%{smart_count} ファイル数のみアップロード可能です',
  },
  youHaveToAtLeastSelectX: {
    '0': '最低でも %{smart_count} ファイル選択してください',
    '1': '最低でも %{smart_count} ファイル選択してください',
  },
  selectFileNamed: 'ファイルを選ぶ %{name}',
  unselectFileNamed: 'ファイルの選択を解除 %{name}',
  openFolderNamed: '開いたフォルダ %{name}',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.ja_JP = ja_JP
}

export default ja_JP
