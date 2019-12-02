const th_TH = {}

th_TH.strings = {
  addMore: 'เพิ่ม',
  addMoreFiles: 'เพิ่มไฟล์',
  addingMoreFiles: 'กำลังเพิ่มไฟล์',
  allowAccessDescription: 'ในการถ่ายภาพหรือบันทึกวิดีโอด้วยกล้องของคุณ โปรดอนุญาตการเข้าถึงกล้อง',
  allowAccessTitle: 'กรุณากดปุ่มยอมรับเพื่อใช้งานกล้อง',
  authenticateWith: 'เชื่อมต่อกับ %{pluginName}',
  authenticateWithTitle: 'กรุณาเข้าใช้งานกับ %{pluginName} เพื่อเลือกไฟล์',
  back: 'ย้อนกลับ',
  browse: 'เรียกดู',
  cancel: 'ยกเลิก',
  cancelUpload: 'ยกเลิกการอัปโหลด',
  chooseFiles: 'เลือกไฟล์',
  closeModal: 'ปิดหน้าต่างนี้',
  companionAuthError: 'คุณไม่มีสืทธ์เข้าใช้งาน',
  companionError: 'การเชื่อมต่อกับ Companion ล้มเหลว',
  companionUnauthorizeHint: 'หากคุณต้องการลงชื่อออกจาก %{provider}, กรุณาไปที่ %{url}',
  complete: 'สำเร็จ',
  connectedToInternet: 'เชื่อมต่อกับอินเทอร์เน็ตสำเร็จ',
  copyLink: 'คัดลอกลิงค์',
  copyLinkToClipboardFallback: 'คัดลอก URL ด้านล่าง',
  copyLinkToClipboardSuccess: 'ลิงก์ถูกคัดลอกไปยังคลิปบอร์ด',
  creatingAssembly: 'กำลังเตรียมอัพโหลด...',
  creatingAssemblyFailed: 'Transloadit: ไม่สามารถสร้าง Assembly',
  dashboardTitle: 'ตัวอัพโหลดไฟล์',
  dashboardWindowTitle: 'หน้าต่างอัพโหลดไฟล์ (กด escape เพื่อปิด)',
  dataUploadedOfTotal: '%{complete} จาก %{total}',
  done: 'เสร็จสิ้น',
  dropHereOr: 'ลากไฟล์มาวางที่นี่ หรือเลือก %{browse}',
  dropHint: 'ลากไฟล์มาวางที่นี่',
  dropPaste: 'ลากไฟล์มาวางที่นี่ หรือเลือก %{browse}',
  dropPasteImport: 'ลากไฟล์มาวางที่นี่ หรือ %{browse} หรือ เปิดกล้อง',
  edit: 'แก้ไข',
  editFile: 'แก้ไขไฟล์',
  editing: 'กำลังแก้ไข %{file}',
  emptyFolderAdded: 'ไม่สามารถเพิ่มไฟล์จากโฟลเดอร์ว่าง',
  encoding: 'กำลังเข้ารหัส...',
  enterCorrectUrl: 'URL ไม่ถูกต้อง: โปรดตรวจสอบให้แน่ใจว่าคุณป้อน direct link',
  enterUrlToImport: 'ป้อน URL เพื่อนำเข้าไฟล์',
  exceedsSize: 'ไฟล์นี้มีขนาดเกินขนาดสูงสุดที่อนุญาต',
  failedToFetch: 'Companion ไม่สามารถเรียก URL นี้ได้, กรุณาตรวจสอบว่า URL ถูกต้อง',
  failedToUpload: 'ไม่สามารถอัปโหลด %{file}',
  fileSource: 'ตำแหน่งของไฟล์: %{name}',
  filesUploadedOfTotal: {
    '0': 'อัพโหลดสำเร็จ %{complete} จากทั้งหมด %{smart_count} ไฟล์',
    '1': 'อัพโหลดสำเร็จ %{complete} จากทั้งหมด %{smart_count} ไฟล์',
    '2': 'อัพโหลดสำเร็จ %{complete} จากทั้งหมด %{smart_count} ไฟล์'
  },
  filter: 'ตัวกรอง',
  finishEditingFile: 'แก้ไขไฟล์สำเร็จ',
  folderAdded: {
    '0': 'เพิ่ม %{smart_count} ไฟล์จาก %{folder}',
    '1': 'เพิ่ม %{smart_count} ไฟล์จาก %{folder}',
    '2': 'เพิ่ม %{smart_count} ไฟล์จาก %{folder}'
  },
  generatingThumbnails: 'กำลังสร้างภาพขนาดย่อ...',
  import: 'นำเข้า',
  importFrom: 'นำเข้าจาก %{name}',
  link: 'ลิงค์',
  loading: 'กำลังโหลด...',
  logOut: 'ออกจากระบบ',
  myDevice: 'ภาพในเครื่อง',
  noFilesFound: 'คุณไม่มีไฟล์หรือโฟลเดอร์ที่นี่',
  noInternetConnection: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
  openFolderNamed: 'เปิดโฟลเดอร์ %{name}',
  pause: 'หยุดชั่วคราว',
  pauseUpload: 'หยุดการอัปโหลดชั่วคราว',
  paused: 'หยุดชั่วคราว',
  poweredBy: 'ขับเคลื่อนโดย',
  preparingUpload: 'กำลังเตรียมอัพโหลด...',
  processingXFiles: {
    '0': 'กำลังประมวลผล %{smart_count} ไฟล์',
    '1': 'กำลังประมวลผล %{smart_count} ไฟล์',
    '2': 'กำลังประมวลผล %{smart_count} ไฟล์'
  },
  removeFile: 'ลบไฟล์',
  resetFilter: 'รีเซ็ตตัวกรอง',
  resume: 'ทำต่อ',
  resumeUpload: 'ทำการอัปโหลดต่อ',
  retry: 'ลองใหม่อีกครั้ง',
  retryUpload: 'ลองอัพโหลดใหม่',
  saveChanges: 'บันทึกการแก้ไข',
  selectAllFilesFromFolderNamed: 'เลือกไฟล์ทั้งหมดจากโฟลเดอร์ %{name}',
  selectFileNamed: 'เลือกไฟล์ %{name}',
  selectX: {
    '0': 'เลือก %{smart_count}',
    '1': 'เลือก %{smart_count}',
    '2': 'เลือก %{smart_count}'
  },
  smile: 'ยิ้ม!',
  startRecording: 'เริ่มการบันทึกวิดีโอ',
  stopRecording: 'หยุดการบันทึกวิดีโอ',
  takePicture: 'ถ่ายภาพ',
  timedOut: 'ยกเลิก, ไม่สามารถอัพโหลดไฟล์ได้เป็นเวลา %{seconds} วินาที',
  unselectAllFilesFromFolderNamed: 'ยกเลิกการเลือกไฟล์ทั้งหมดจากโฟลเดอร์ %{name}',
  unselectFileNamed: 'ยกเลิกการเลือกไฟล์ %{name}',
  upload: 'อัพโหลด',
  uploadComplete: 'อัพโหลดไฟล์สำเร็จ',
  uploadFailed: 'อัปโหลดไฟล์ไม่สำเร็จ',
  uploadPaused: 'หยุดอัปโหลดไฟล์ชั่วคราว',
  uploadXFiles: {
    '0': 'กำลังอัพโหลด %{smart_count} ไฟล์',
    '1': 'กำลังอัพโหลด %{smart_count} ไฟล์',
    '2': 'กำลังอัพโหลด %{smart_count} ไฟล์'
  },
  uploadXNewFiles: {
    '0': 'กำลังอัพโหลด +%{smart_count} ไฟล์',
    '1': 'กำลังอัพโหลด +%{smart_count} ไฟล์',
    '2': 'กำลังอัพโหลด +%{smart_count} ไฟล์'
  },
  uploading: 'Uploading',
  uploadingXFiles: {
    '0': 'กำลังอัพโหลด %{smart_count} ไฟล์',
    '1': 'กำลังอัพโหลด %{smart_count} ไฟล์',
    '2': 'กำลังอัพโหลด %{smart_count} ไฟล์'
  },
  xFilesSelected: {
    '0': '%{smart_count} ไฟล์ถูกเลือก',
    '1': '%{smart_count} ไฟล์ถูกเลือก',
    '2': '%{smart_count} ไฟล์ถูกเลือก'
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} ไฟล์ที่สามารถเพิ่มได้',
    '1': '%{smart_count} ไฟล์ที่สามารถเพิ่มได้',
    '2': '%{smart_count} ไฟล์ที่สามารถเพิ่มได้'
  },
  xTimeLeft: 'เหลืออีก %{time}',
  youCanOnlyUploadFileTypes: 'คุณสามารถอัพโหลดได้แค่: %{types}',
  youCanOnlyUploadX: {
    '0': 'คุณสามารถอัพโหลดได้แค่ %{smart_count} ไฟล์',
    '1': 'คุณสามารถอัพโหลดได้แค่ %{smart_count} ไฟล์',
    '2': 'คุณสามารถอัพโหลดได้แค่ %{smart_count} ไฟล์'
  },
  youHaveToAtLeastSelectX: {
    '0': 'คุณต้องเลือกอย่างน้อย %{smart_count} ไฟล์',
    '1': 'คุณต้องเลือกอย่างน้อย %{smart_count} ไฟล์',
    '2': 'คุณต้องเลือกอย่างน้อย %{smart_count} ไฟล์'
  }
}

th_TH.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.th_TH = th_TH
}

module.exports = th_TH
