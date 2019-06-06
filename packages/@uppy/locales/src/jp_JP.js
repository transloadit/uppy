/* eslint camelcase: 0 */

const jp_JP = {}

js_JP.strings = {
  addMoreFiles: 'ファイルを追加',
  addingMoreFiles: 'ファイルを追加しています',
  allowAccessDescription: 'カメラやビデオの機能を使用するには、カメラへのアクセスを許可してください。',
  allowAccessTitle: 'カメラへのアクセスを許可してください',
  authenticateWith: '%{pluginName}に接続します',
  authenticateWithTitle: 'ファイルを選択するには%{pluginName}で認証してください',
  back: '戻る',
  browse: '参照',
  cancel: 'キャンセル',
  cancelUpload: 'アップロードをキャンセル',
  chooseFiles: 'ファイルを選択',
  closeModal: 'モーダルを閉じる',
  companionAuthError: '認証が必要です',
  companionError: 'Companionとの接続に失敗しました',
  complete: '完了しました',
  connectedToInternet: 'インターネットに接続しました',
  copyLink: 'リンクをコピー',
  copyLinkToClipboardFallback: '以下のURLをコピー',
  copyLinkToClipboardSuccess: 'リンクをクリップボードにコピーしました',
  creatingAssembly: 'アップロードの準備をしています...',
  creatingAssemblyFailed: 'Transloadit: アセンブリを作成できませんでした',
  dashboardTitle: 'ファイルアップローダー',
  dashboardWindowTitle: 'ファイルアップローダーウィンドウ（閉じるにはEscapeキーを押してください）',
  dataUploadedOfTotal: '%{total}%{complete}',
  done: '完了しました',
  dropHereOr: 'ここにファイルをドロップするか%{browse}してください',
  dropHint: 'ここにファイルをドロップしてください',
  dropPaste: 'ここにファイルをドロップするか、貼り付けるか、%{browse}してください',
  dropPasteImport: 'ここにファイルをドロップするか、貼り付けるか、%{browse}するか、以下からインポートしてください',
  edit: '編集',
  editFile: 'ファイルを編集',
  editing: '%{file}を編集しています',
  emptyFolderAdded: 'フォルダが空なためファイルが追加されませんでした',
  encoding: 'エンコードしています...',
  enterCorrectUrl: '不正なURL: ファイルへの直接リンクが入力されていることを確認してください',
  enterUrlToImport: 'ファイルをインポートするためのURLを入力してください',
  exceedsSize: 'ファイルサイズが大きすぎます',
  failedToFetch: 'CompanionがURLを取得できませんでした。URLが正しいか確認してください',
  failedToUpload: '%{file}のアップロードに失敗しました',
  fileSource: '元ファイル：%{name}',
  filesUploadedOfTotal: {
    '0': '%{smart_count}個のファイルのアップロードが%{complete}',
    '1': '%{smart_count}個のファイルのアップロードが%{complete}',
    '2': '%{cmart_count}個のファイルのアップロードが%{complete}'
  },
  filter: 'フィルタ',
  finishEditingFile: 'ファイルの編集を終了',
  folderAdded: {
    '0': '%{folder}から%{smart_count}個のファイルを追加しました',
    '1': '%{folder}から%{smart_count}個のファイルを追加しました',
    '2': '%{folder}から%{smart_count}個のファイルを追加しました'
  },
  import: 'インポート',
  importFrom: '%{name}からインポート',
  link: 'リンク',
  loading: 'ロード中...',
  logOut: 'ログアウト',
  myDevice: 'マイデバイス',
  noFilesFound: 'ファイルやフォルダがありません',
  noInternetConnection: 'インターネット接続がありません',
}

jp_JP.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.jp_JP = jp_JP
}

module.exports = jp_JP
