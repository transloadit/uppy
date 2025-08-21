import type { Locale } from '@uppy/utils'

const hi_IN: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

hi_IN.strings = {
  addBulkFilesFailed: {
    '0': 'आंतरिक त्रुटि के कारण %{smart_count} फ़ाइल जोड़ने में विफल',
    '1': 'आंतरिक त्रुटियों के कारण %{smart_count} फ़ाइलें जोड़ने में विफल',
  },
  addMore: 'और जोड़ें',
  addMoreFiles: 'और अधिक फ़ाइलें जोड़ें',
  addingMoreFiles: 'और अधिक फ़ाइलें जोड़ रहे हैं',
  allowAccessDescription:
    'अपने कैमरे से फ़ोटो लेने या वीडियो रिकॉर्ड करने के लिए, कृपया इस साइट के लिए कैमरा पहुंच की अनुमति दें।',
  allowAccessTitle: 'कृपया अपने कैमरे तक पहुंचने की अनुमति दें',
  aspectRatioLandscape: 'लैंडस्केप क्रॉप करें (16:9)',
  aspectRatioPortrait: 'पोर्ट्रेट क्रॉप करें (9:16)',
  aspectRatioSquare: 'वर्ग क्रॉप करें',
  authenticateWith: '%{pluginName} से कनेक्ट करें',
  authenticateWithTitle: '%{pluginName} के साथ सत्यापित करें ताकि फ़ाइलें चुन सकें',
  back: 'वापस',
  backToSearch: 'खोज पर वापस जाएं',
  browse: 'ब्राउज़ करें',
  browseFiles: 'फ़ाइलें ब्राउज़ करें',
  browseFolders: 'फ़ोल्डर ब्राउज़ करें',
  cancel: 'रद्द करें',
  cancelUpload: 'अपलोड रद्द करें',
  closeModal: 'मोडल बंद करें',
  companionError: 'कंपैनियन के साथ कनेक्शन विफल',
  companionUnauthorizeHint:
    'अपने %{provider} खाते को अनधिकृत करने के लिए, कृपया %{url} पर जाएँ',
  complete: 'पूरा हो गया',
  connectedToInternet: 'इंटरनेट से जुड़ा हुआ',
  copyLink: 'लिंक कॉपी करें',
  copyLinkToClipboardFallback: 'नीचे दिए गए URL को कॉपी करें',
  copyLinkToClipboardSuccess: 'लिंक क्लिपबोर्ड पर कॉपी किया गया',
  creatingAssembly: 'अपलोड की तैयारी...',
  creatingAssemblyFailed: 'Transloadit: असेंबली बना नहीं सका',
  dashboardTitle: 'फ़ाइल अपलोडर',
  dashboardWindowTitle: 'फ़ाइल अपलोडर विंडो (बंद करने के लिए एस्केप दबाएं)',
  dataUploadedOfTotal: '%{complete} का %{total}',
  discardRecordedFile: 'रिकॉर्डेड फ़ाइल को छोड़ें',
  done: 'हो गया',
  dropHint: 'यहाँ अपनी फ़ाइलें ड्रॉप करें',
  dropPasteBoth: 'यहाँ फ़ाइलें ड्रॉप करें, %{browseFiles} या %{browseFolders}',
  dropPasteFiles: 'यहाँ फ़ाइलें ड्रॉप करें या %{browseFiles}',
  dropPasteFolders: 'यहाँ फ़ाइलें ड्रॉप करें या %{browseFolders}',
  dropPasteImportBoth:
    'यहां फ़ाइलें ड्रॉप करें, %{browseFiles}, %{browseFolders} या इससे आयात करें:',
  dropPasteImportFiles: 'यहां फ़ाइलें ड्रॉप करें, %{browseFiles} या इससे आयात करें:',
  dropPasteImportFolders: 'यहां फ़ाइलें ड्रॉप करें, %{browseFolders} या इससे आयात करें:',
  editFile: 'फ़ाइल संपादित करें',
  editImage: 'छवि संपादित करें',
  editing: 'संपादन %{file}',
  emptyFolderAdded: 'खाली फ़ोल्डर से कोई फ़ाइलें नहीं जोड़ी गईं',
  encoding: 'एन्कोडिंग...',
  enterCorrectUrl:
    'गलत यूआरएल: कृपया सुनिश्चित करें कि आप एक फ़ाइल के सीधे लिंक दर्ज कर रहे हैं',
  enterTextToSearch: 'छवियाँ खोजने के लिए टेक्स्ट दर्ज करें',
  enterUrlToImport: 'फ़ाइल आयात करने के लिए यूआरएल दर्ज करें',
  exceedsSize: '%{file} की अधिकतम अनुमति देने वाले आकार को पार करता है',
  exceedsSize2: '%{backwardsCompat} %{size}',
  failedToFetch:
    'Companion इस URL को लाने में विफल रहा, कृपया सुनिश्चित करें कि यह सही है',
  failedToUpload: '%{file} अपलोड करने में विफल रहा',
  fileSource: 'फ़ाइल स्रोत: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} का %{smart_count} फ़ाइल अपलोड किया गया',
    '1': '%{complete} के %{smart_count} फ़ाइलें अपलोड की गईं',
  },
  filter: 'फ़िल्टर',
  finishEditingFile: 'फ़ाइल संपादित करना समाप्त करें',
  flipHorizontal: 'क्षैतिज पलटें',
  folderAdded: {
    '0': '%{folder} से %{smart_count} फ़ाइल जोड़ी गई',
    '1': '%{folder} से %{smart_count} फ़ाइलें जोड़ी गई',
  },
  generatingThumbnails: 'थंबनेल उत्पन्न कर रहा है...',
  import: 'आयात',
  importFiles: 'फ़ाइलों को इम्पोर्ट करें:',
  importFrom: '%{name} से आयात करें',
  inferiorSize: 'इस फ़ाइल का आकार %{size} से छोटा है',
  loading: 'लोड हो रहा है...',
  logOut: 'लॉग आउट',
  micDisabled: 'उपयोगकर्ता द्वारा माइक्रोफ़ोन पहुंच नहीं हो सका',
  myDevice: 'मेरी उपकरण',
  noCameraDescription:
    'तस्वीरें लेने या वीडियो रिकॉर्ड करने के लिए, कृपया कैमरा डिवाइस कनेक्ट करें',
  noCameraTitle: 'कैमरा उपलब्ध नहीं है',
  noDuplicates: "डुप्लिकेट फ़ाइल '%{fileName}' नहीं जोड़ सकते, यह पहले से मौजूद है",
  noFilesFound: 'यहां आपके पास कोई फ़ाइल या फ़ोल्डर नहीं है',
  noInternetConnection: 'इंटरनेट कनेक्शन नहीं',
  noNewAlreadyUploading: 'नई फ़ाइलें नहीं जोड़ सकते: पहले से अपलोड कर रहे हैं',
  openFolderNamed: 'फ़ोल्डर %{name} खोलें',
  pause: 'रोकें',
  pauseUpload: 'अपलोड रोकें',
  paused: 'रोका हुआ',
  poweredBy: 'प्रायोजित द्वारा',
  poweredBy2: '%{backwardsCompat} %{uppy}',
  processingXFiles: {
    '0': '%{smart_count} फ़ाइल को प्रोसेस कर रहा है',
    '1': '%{smart_count} फ़ाइलें प्रोसेस कर रहा है',
  },
  reSelect: 'पुनः-चुनें',
  recording: 'रिकॉर्डिंग',
  recordingLength: 'रिकॉर्डिंग की लंबाई %{recording_length}',
  recordingStoppedMaxSize:
    'रिकॉर्डिंग रोक दी गई क्योंकि फ़ाइल का आकार सीमा को पार करने वाला है',
  recoveredAllFiles:
    'हमने सभी फ़ाइलों को पुनर्स्थापित कर दिया है। अब आप अपलोड को फिर से शुरू कर सकते हैं।',
  recoveredXFiles: {
    '0': 'हम 1 फ़ाइल को पूरी तरह से वसूल नहीं कर सके। कृपया इसे फिर से चुनें और अपलोड जारी रखें।',
    '1': 'हम %{smart_count} फ़ाइलों को पूरी तरह से वसूल नहीं कर सके। कृपया उन्हें फिर से चुनें और अपलोड जारी रखें।',
  },
  removeFile: 'फ़ाइल हटाएँ',
  resetFilter: 'फ़िल्टर रीसेट करें',
  resume: 'जारी रखें',
  resumeUpload: 'अपलोड जारी रखें',
  retry: 'पुनः प्रयास करें',
  retryUpload: 'अपलोड पुनः प्रयास करें',
  revert: 'वापस लें',
  rotate: 'घुमाएँ',
  save: 'सहेजें',
  saveChanges: 'परिवर्तन सहेजें',
  searchImages: 'चित्रों के लिए खोजें',
  selectAllFilesFromFolderNamed: 'फ़ोल्डर %{name} से सभी फ़ाइलें चुनें',
  selectFileNamed: 'फ़ाइल %{name} चुनें',
  selectX: {
    '0': '%{smart_count} चुनें',
    '1': '%{smart_count} चुनें',
  },
  sessionRestored: 'सत्र बहाल',
  smile: 'मुस्कराइए!',
  startCapturing: 'स्क्रीन कैप्चर शुरू करें',
  startRecording: 'वीडियो रिकॉर्डिंग शुरू करें',
  stopCapturing: 'स्क्रीन कैप्चर बंद करें',
  stopRecording: 'वीडियो रिकॉर्डिंग रोकें',
  streamActive: 'स्ट्रीम सक्रिय',
  streamPassive: 'स्ट्रीम निष्क्रिय',
  submitRecordedFile: 'रिकॉर्ड की गई फ़ाइल सबमिट करें',
  takePicture: 'एक तस्वीर लें',
  timedOut: 'अपलोड %{seconds} सेकंड के लिए अवरुद्ध हुआ, निरस्त कर रहा है।',
  unselectAllFilesFromFolderNamed: 'फ़ोल्डर %{name} से सभी फ़ाइलों को अचयनित करें',
  unselectFileNamed: 'फ़ाइल %{name} को अचयनित करें',
  upload: 'अपलोड',
  uploadComplete: 'अपलोड पूरा हुआ',
  uploadFailed: 'अपलोड विफल',
  uploadPaused: 'अपलोड रुका हुआ',
  uploadXFiles: {
    '0': '%{smart_count} फ़ाइल अपलोड करें',
    '1': '%{smart_count} फ़ाइलें अपलोड करें',
  },
  uploadXNewFiles: {
    '0': '+%{smart_count} फ़ाइल अपलोड करें',
    '1': '+%{smart_count} फ़ाइलें अपलोड करें',
  },
  uploading: 'अपलोड हो रहा है',
  uploadingXFiles: {
    '0': '%{smart_count} फ़ाइल अपलोड हो रही है',
    '1': '%{smart_count} फ़ाइलें अपलोड कर रहे हैं',
  },
  xFilesSelected: {
    '0': '%{smart_count} फ़ाइल चयनित',
    '1': '%{smart_count} फ़ाइलें चयनित',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} और फ़ाइल जोड़ी गई',
    '1': '%{smart_count} और फ़ाइलें जोड़ी गई',
  },
  xTimeLeft: '%{time} शेष',
  youCanOnlyUploadFileTypes: 'आप केवल %{types} अपलोड कर सकते हैं',
  youCanOnlyUploadX: {
    '0': 'आप केवल %{smart_count} फ़ाइल अपलोड कर सकते हैं',
    '1': 'आप केवल %{smart_count} फ़ाइलें अपलोड कर सकते हैं',
  },
  youHaveToAtLeastSelectX: {
    '0': 'आपको कम से कम %{smart_count} फ़ाइल का चयन करना होगा',
    '1': 'आपको कम से कम %{smart_count} फ़ाइलें चुननी होंगी',
  },
  zoomIn: 'ज़ूम इन',
  zoomOut: 'ज़ूम आउट',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.hi_IN = hi_IN
}

export default hi_IN
