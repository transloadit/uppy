const is_IS = {
  pluralize (n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

is_IS.strings = {
  addMore: 'Bæta við',
  addMoreFiles: 'Bæta við fleiri skrám',
  addingMoreFiles: 'Bæti við fleiri skrám',
  allowAccessDescription:
        'Vinsamlegast gefðu aðgang að myndavélinni þinni, til þess að taka myndir eða taka upp myndband með myndavélinni þinni.',
  allowAccessTitle: 'Vinsamlegast gefðu aðgang að myndavélinni þinni.',
  authenticateWith: 'Tengjast %{pluginName}',
  authenticateWithTitle:
        'Vinsamlegast auðkenndu %{pluginName} til þess að velja skrár',
  back: 'Til baka',
  browse: 'skoða',
  browseFiles: 'skoða',
  cancel: 'Hætta við',
  cancelUpload: 'Hætta við að hlaða upp',
  chooseFiles: 'Veldu skrár',
  closeModal: 'Loka glugga',
  companionError: 'Tengin mistókst',
  companionUnauthorizeHint:
        'Til þess að leyfa aðgang að %{provider}, vinsamlegast smelltu hér: %{url}',
  complete: 'Lokið',
  connectedToInternet: 'Tengdur við internet',
  copyLink: 'Afrita hlekk',
  copyLinkToClipboardFallback: 'Afrita hlekk',
  copyLinkToClipboardSuccess: 'Hlekkur hefur verið afritaður',
  creatingAssembly: 'Undirbý að hlaða upp...',
  creatingAssemblyFailed: 'Transloadit: Tókst ekki að búa til samsetningu',
  dashboardTitle: 'Hlaða upp skrám',
  dashboardWindowTitle: 'Upphleðslugluggi (Smelltu á ESC til að loka)',
  dataUploadedOfTotal: '%{complete} af %{total}',
  done: 'Búið',
  dropHereOr: 'Dragðu skrár hingað eða %{browse}',
  dropHint: 'Dragðu skrárnar þínar hingað',
  dropPasteBoth: 'Slepptu skrám hérna, límdu (paste) eða %{browse}',
  dropPasteFiles: 'Slepptu skrám hérna, límdu (paste) eða %{browse}',
  dropPasteFolders: 'Slepptu skrám hérna, límdu (paste) eða %{browse}',
  dropPasteImportBoth: 'Slepptu skrám hérna, límdu (paste), %{browse} eða bættu við frá',
  dropPasteImportFiles: 'Slepptu skrám hérna, límdu (paste), %{browse} eða bættu við frá',
  dropPasteImportFolders: 'Slepptu skrám hérna, límdu (paste), %{browse} eða bættu við frá',
  editFile: 'Breyta skrá',
  editing: 'Breyti %{file}',
  emptyFolderAdded: 'Engum skrám var bætt við frá tómri möppu',
  encoding: 'Dulkóða...',
  enterCorrectUrl:
        'Röng slóð: Vinsamlegast passaðu að þú sért að bæta við hlekk sem vísar beint á skrá',
  enterUrlToImport: 'Settu inn hlekk til að bæta við skrá',
  exceedsSize: 'Þessi skrá er stærri en hún má vera  %{size}',
  failedToFetch:
        'Það tókst ekki að sækja þennan hlekk, vinsamlegast passaðu að hann sé réttur',
  failedToUpload: 'Mistókst að upphala %{file}',
  fileSource: 'Uppruni skráar: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} af %{smart_count} skrá upphalað',
    '1': '%{complete} af %{smart_count} skrám upphalað',
    '2': '%{complete} af %{smart_count} skrám upphalað',
  },
  filter: 'Sía',
  finishEditingFile: 'Klára að breyta skrá',
  folderAdded: {
    '0': 'Bætt við %{smart_count} skrá frá %{folder}',
    '1': 'Bætt við %{smart_count} skrám frá %{folder}',
    '2': 'Bætt við %{smart_count} skrám frá %{folder}',
  },
  generatingThumbnails: 'Bý til smámynd ...',
  import: 'Flytja inn',
  importFrom: 'Flytja inn frá %{name}',
  loading: 'Hleð...',
  logOut: 'Skrá út',
  myDevice: 'Mitt tæki',
  noFilesFound: 'Þú átt engar skrár eða möppur hér',
  noInternetConnection: 'Engin nettenging',
  openFolderNamed: 'Opna möppu %{name}',
  pause: 'Gera hlé',
  pauseUpload: 'Gera hlé á upphölun',
  paused: 'Hlé í gangi',
  poweredBy: 'Knúið af %{uppy}',
  processingXFiles: {
    '0': 'Vinn %{smart_count} skrá',
    '1': 'Vinn %{smart_count} skrár',
    '2': 'Vinn %{smart_count} skrár',
  },
  removeFile: 'Fjarlægja skrá',
  resetFilter: 'Endurstilla síu',
  resume: 'Halda áfram',
  resumeUpload: 'Halda áfram með upphölun',
  retry: 'Reyna aftur',
  retryUpload: 'Reyna upphölun aftur',
  saveChanges: 'Vista breytingar',
  selectFileNamed: 'Velja skrá %{name}',
  selectX: {
    '0': 'Velja %{smart_count}',
    '1': 'Velja %{smart_count}',
    '2': 'Velja %{smart_count}',
  },
  smile: 'Brostu!',
  startRecording: 'Byrja myndbandsupptöku',
  stopRecording: 'Stöðva myndbandsupptöku',
  takePicture: 'Taka mynd',
  timedOut: 'Upphölun tafin um %{seconds} sekúndur, hætti við.',
  unselectFileNamed: 'Afvelja skrá %{name}',
  upload: 'Upphala',
  uploadComplete: 'Upphölun lokið',
  uploadFailed: 'Upphölun mistókst',
  uploadPaused: 'Upphölun stöðvuð',
  uploadXFiles: {
    '0': 'Upphala %{smart_count} skrá',
    '1': 'Upphala %{smart_count} skrám',
    '2': 'Upphala %{smart_count} skrám',
  },
  uploadXNewFiles: {
    '0': 'Upphala +%{smart_count} skrá',
    '1': 'Upphala +%{smart_count} skrám',
    '2': 'Upphala +%{smart_count} skrám',
  },
  uploading: 'Upphala',
  uploadingXFiles: {
    '0': 'Upphala %{smart_count} skrá',
    '1': 'Upphala %{smart_count} skrám',
    '2': 'Upphala %{smart_count} skrám',
  },
  xFilesSelected: {
    '0': '%{smart_count} skrá valin',
    '1': '%{smart_count} skrár valdar',
    '2': '%{smart_count} skrár valdar',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} fleiri skrá bætt við',
    '1': '%{smart_count} fleiri skrám bætt við',
    '2': '%{smart_count} fleiri skrám bætt við',
  },
  xTimeLeft: '%{time} eftir',
  youCanOnlyUploadFileTypes: 'Þú getur aðeins upphalað: %{types}',
  youCanOnlyUploadX: {
    '0': 'Þú getur aðeins upphalað %{smart_count} skrá',
    '1': 'Þú getur aðeins upphalað %{smart_count} skrám',
    '2': 'Þú getur aðeins upphalað %{smart_count} skrám',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Þú verður að velja lágmark %{smart_count} skrá',
    '1': 'Þú verður að velja lágmark %{smart_count} skrár',
    '2': 'Þú verður að velja lágmark %{smart_count} skrár',
  },
}

if (typeof Uppy !== 'undefined') {
  globalThis.Uppy.locales.is_IS = is_IS
}

export default is_IS
