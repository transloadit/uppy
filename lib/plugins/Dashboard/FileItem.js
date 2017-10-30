'use strict';

var _appendChild = require('yo-yoify/lib/appendChild'),
    _svgNamespace = 'http://www.w3.org/2000/svg';

var _require = require('../../core/Utils'),
    getETA = _require.getETA,
    getSpeed = _require.getSpeed,
    prettyETA = _require.prettyETA,
    getFileNameAndExtension = _require.getFileNameAndExtension,
    truncateString = _require.truncateString,
    copyToClipboard = _require.copyToClipboard;

var prettyBytes = require('prettier-bytes');
var FileItemProgress = require('./FileItemProgress');
var getFileTypeIcon = require('./getFileTypeIcon');

var _require2 = require('./icons'),
    iconEdit = _require2.iconEdit,
    iconCopy = _require2.iconCopy,
    iconRetry = _require2.iconRetry;

module.exports = function fileItem(props) {
  var _uppyDashboardItemPreviewInnerWrap, _uppyDashboardItemProgressBtn, _uppyDashboardItemProgress, _uppyDashboardItemPreview, _uppyDashboardItemName, _uppyDashboardItemStatus, _uppyDashboardItemInfo, _uppyDashboardItemAction, _li, _img, _uppyDashboardItemPreviewIcon, _path, _path2, _g, _uppyDashboardItemPreviewIconBg, _uppyDashboardItemPreviewIconWrap, _uppyDashboardItemProgressInfo, _span, _a, _uppyDashboardItemStatusSize, _uppyDashboardItemSourceIcon, _uppyDashboardItemEdit, _uppyDashboardItemCopyLink, _ellipse, _path3, _uppyIcon, _uppyDashboardItemRemove;

  var file = props.file;
  var acquirers = props.acquirers;

  var isProcessing = file.progress.preprocess || file.progress.postprocess;
  var isUploaded = file.progress.uploadComplete && !isProcessing && !file.error;
  var uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing;
  var uploadInProgress = file.progress.uploadStarted && !file.progress.uploadComplete || isProcessing;
  var isPaused = file.isPaused || false;
  var error = file.error || false;

  var fileName = getFileNameAndExtension(file.meta.name).name;
  var truncatedFileName = props.isWide ? truncateString(fileName, 15) : fileName;

  var onPauseResumeCancelRetry = function onPauseResumeCancelRetry(ev) {
    if (isUploaded) return;
    if (error) {
      props.retryUpload(file.id);
      return;
    }
    if (props.resumableUploads) {
      props.pauseUpload(file.id);
    } else {
      props.cancelUpload(file.id);
    }
  };

  return _li = document.createElement('li'), _li.setAttribute('id', 'uppy_' + String(file.id) + ''), _li.setAttribute('title', '' + String(file.meta.name) + ''), _li.setAttribute('class', 'UppyDashboardItem\n                        ' + String(uploadInProgress ? 'is-inprogress' : '') + '\n                        ' + String(isProcessing ? 'is-processing' : '') + '\n                        ' + String(isUploaded ? 'is-complete' : '') + '\n                        ' + String(isPaused ? 'is-paused' : '') + '\n                        ' + String(error ? 'is-error' : '') + '\n                        ' + String(props.resumableUploads ? 'is-resumable' : '') + ''), _appendChild(_li, [' ', (_uppyDashboardItemPreview = document.createElement('div'), _uppyDashboardItemPreview.setAttribute('class', 'UppyDashboardItem-preview'), _appendChild(_uppyDashboardItemPreview, [' ', (_uppyDashboardItemPreviewInnerWrap = document.createElement('div'), _uppyDashboardItemPreviewInnerWrap.setAttribute('style', 'background-color: ' + String(getFileTypeIcon(file.type).color) + ''), _uppyDashboardItemPreviewInnerWrap.setAttribute('class', 'UppyDashboardItem-previewInnerWrap'), _appendChild(_uppyDashboardItemPreviewInnerWrap, [' ', file.preview ? (_img = document.createElement('img'), _img.setAttribute('alt', '' + String(file.name) + ''), _img.setAttribute('src', '' + String(file.preview) + ''), _img) : (_uppyDashboardItemPreviewIconWrap = document.createElement('div'), _uppyDashboardItemPreviewIconWrap.setAttribute('class', 'UppyDashboardItem-previewIconWrap'), _appendChild(_uppyDashboardItemPreviewIconWrap, [' ', (_uppyDashboardItemPreviewIcon = document.createElement('span'), _uppyDashboardItemPreviewIcon.setAttribute('style', 'color: ' + String(getFileTypeIcon(file.type).color) + ''), _uppyDashboardItemPreviewIcon.setAttribute('class', 'UppyDashboardItem-previewIcon'), _appendChild(_uppyDashboardItemPreviewIcon, [getFileTypeIcon(file.type).icon]), _uppyDashboardItemPreviewIcon), ' ', (_uppyDashboardItemPreviewIconBg = document.createElementNS(_svgNamespace, 'svg'), _uppyDashboardItemPreviewIconBg.setAttribute('width', '72'), _uppyDashboardItemPreviewIconBg.setAttribute('height', '93'), _uppyDashboardItemPreviewIconBg.setAttribute('viewBox', '0 0 72 93'), _uppyDashboardItemPreviewIconBg.setAttribute('class', 'UppyDashboardItem-previewIconBg'), _appendChild(_uppyDashboardItemPreviewIconBg, [(_g = document.createElementNS(_svgNamespace, 'g'), _appendChild(_g, [(_path = document.createElementNS(_svgNamespace, 'path'), _path.setAttribute('d', 'M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z'), _path.setAttribute('fill', '#FFF'), _path), (_path2 = document.createElementNS(_svgNamespace, 'path'), _path2.setAttribute('d', 'M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z'), _path2.setAttribute('fill', '#E4E4E4'), _path2)]), _g)]), _uppyDashboardItemPreviewIconBg), ' ']), _uppyDashboardItemPreviewIconWrap), ' ']), _uppyDashboardItemPreviewInnerWrap), ' ', (_uppyDashboardItemProgress = document.createElement('div'), _uppyDashboardItemProgress.setAttribute('class', 'UppyDashboardItem-progress'), _appendChild(_uppyDashboardItemProgress, [' ', (_uppyDashboardItemProgressBtn = document.createElement('button'), _uppyDashboardItemProgressBtn.setAttribute('type', 'button'), _uppyDashboardItemProgressBtn.setAttribute('title', '' + String(isUploaded ? 'upload complete' : props.resumableUploads ? file.isPaused ? 'resume upload' : 'pause upload' : 'cancel upload') + ''), _uppyDashboardItemProgressBtn.onclick = onPauseResumeCancelRetry, _uppyDashboardItemProgressBtn.setAttribute('class', 'UppyDashboardItem-progressBtn'), _appendChild(_uppyDashboardItemProgressBtn, [' ', error ? iconRetry() : FileItemProgress({
    progress: file.progress.percentage,
    fileID: file.id
  }), ' ']), _uppyDashboardItemProgressBtn), ' ', props.showProgressDetails ? (_uppyDashboardItemProgressInfo = document.createElement('div'), _uppyDashboardItemProgressInfo.setAttribute('title', '' + String(props.i18n('fileProgress')) + ''), _uppyDashboardItemProgressInfo.setAttribute('aria-label', '' + String(props.i18n('fileProgress')) + ''), _uppyDashboardItemProgressInfo.setAttribute('class', 'UppyDashboardItem-progressInfo'), _appendChild(_uppyDashboardItemProgressInfo, [' ', !file.isPaused && !isUploaded ? (_span = document.createElement('span'), _appendChild(_span, [prettyETA(getETA(file.progress)), ' \u30FB \u2191 ', prettyBytes(getSpeed(file.progress)), '/s']), _span) : null, ' ']), _uppyDashboardItemProgressInfo) : null, ' ']), _uppyDashboardItemProgress), ' ']), _uppyDashboardItemPreview), ' ', (_uppyDashboardItemInfo = document.createElement('div'), _uppyDashboardItemInfo.setAttribute('class', 'UppyDashboardItem-info'), _appendChild(_uppyDashboardItemInfo, [' ', (_uppyDashboardItemName = document.createElement('h4'), _uppyDashboardItemName.setAttribute('title', '' + String(fileName) + ''), _uppyDashboardItemName.setAttribute('class', 'UppyDashboardItem-name'), _appendChild(_uppyDashboardItemName, [' ', file.uploadURL ? (_a = document.createElement('a'), _a.setAttribute('href', '' + String(file.uploadURL) + ''), _a.setAttribute('target', '_blank'), _appendChild(_a, [' ', file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName, ' ']), _a) : file.extension ? truncatedFileName + '.' + file.extension : truncatedFileName, ' ']), _uppyDashboardItemName), ' ', (_uppyDashboardItemStatus = document.createElement('div'), _uppyDashboardItemStatus.setAttribute('class', 'UppyDashboardItem-status'), _appendChild(_uppyDashboardItemStatus, [' ', file.data.size && (_uppyDashboardItemStatusSize = document.createElement('div'), _uppyDashboardItemStatusSize.setAttribute('class', 'UppyDashboardItem-statusSize'), _appendChild(_uppyDashboardItemStatusSize, [prettyBytes(file.data.size)]), _uppyDashboardItemStatusSize), ' ', file.source && (_uppyDashboardItemSourceIcon = document.createElement('div'), _uppyDashboardItemSourceIcon.setAttribute('class', 'UppyDashboardItem-sourceIcon'), _appendChild(_uppyDashboardItemSourceIcon, [' ', acquirers.map(function (acquirer) {
    var _span2;

    if (acquirer.id === file.source) return _span2 = document.createElement('span'), _span2.setAttribute('title', '' + String(props.i18n('fileSource')) + ': ' + String(acquirer.name) + ''), _appendChild(_span2, [acquirer.icon()]), _span2;
  }), ' ']), _uppyDashboardItemSourceIcon), ' ']), _uppyDashboardItemStatus), ' ', !uploadInProgressOrComplete ? (_uppyDashboardItemEdit = document.createElement('button'), _uppyDashboardItemEdit.setAttribute('type', 'button'), _uppyDashboardItemEdit.setAttribute('aria-label', 'Edit file'), _uppyDashboardItemEdit.setAttribute('title', 'Edit file'), _uppyDashboardItemEdit.onclick = function (e) {
    return props.showFileCard(file.id);
  }, _uppyDashboardItemEdit.setAttribute('class', 'UppyDashboardItem-edit'), _appendChild(_uppyDashboardItemEdit, [' ', iconEdit()]), _uppyDashboardItemEdit) : null, ' ', file.uploadURL ? (_uppyDashboardItemCopyLink = document.createElement('button'), _uppyDashboardItemCopyLink.setAttribute('type', 'button'), _uppyDashboardItemCopyLink.setAttribute('aria-label', 'Copy link'), _uppyDashboardItemCopyLink.setAttribute('title', 'Copy link'), _uppyDashboardItemCopyLink.onclick = function () {
    copyToClipboard(file.uploadURL, props.i18n('copyLinkToClipboardFallback')).then(function () {
      props.log('Link copied to clipboard.');
      props.info(props.i18n('copyLinkToClipboardSuccess'), 'info', 3000);
    }).catch(props.log);
  }, _uppyDashboardItemCopyLink.setAttribute('class', 'UppyDashboardItem-copyLink'), _appendChild(_uppyDashboardItemCopyLink, [iconCopy()]), _uppyDashboardItemCopyLink) : null, ' ']), _uppyDashboardItemInfo), ' ', (_uppyDashboardItemAction = document.createElement('div'), _uppyDashboardItemAction.setAttribute('class', 'UppyDashboardItem-action'), _appendChild(_uppyDashboardItemAction, [' ', !isUploaded ? (_uppyDashboardItemRemove = document.createElement('button'), _uppyDashboardItemRemove.setAttribute('type', 'button'), _uppyDashboardItemRemove.setAttribute('aria-label', 'Remove file'), _uppyDashboardItemRemove.setAttribute('title', 'Remove file'), _uppyDashboardItemRemove.onclick = function () {
    return props.removeFile(file.id);
  }, _uppyDashboardItemRemove.setAttribute('class', 'UppyDashboardItem-remove'), _appendChild(_uppyDashboardItemRemove, [' ', (_uppyIcon = document.createElementNS(_svgNamespace, 'svg'), _uppyIcon.setAttribute('width', '22'), _uppyIcon.setAttribute('height', '21'), _uppyIcon.setAttribute('viewBox', '0 0 18 17'), _uppyIcon.setAttribute('class', 'UppyIcon'), _appendChild(_uppyIcon, [' ', (_ellipse = document.createElementNS(_svgNamespace, 'ellipse'), _ellipse.setAttribute('cx', '8.62'), _ellipse.setAttribute('cy', '8.383'), _ellipse.setAttribute('rx', '8.62'), _ellipse.setAttribute('ry', '8.383'), _ellipse), ' ', (_path3 = document.createElementNS(_svgNamespace, 'path'), _path3.setAttribute('stroke', '#FFF'), _path3.setAttribute('fill', '#FFF'), _path3.setAttribute('d', 'M11 6.147L10.85 6 8.5 8.284 6.15 6 6 6.147 8.35 8.43 6 10.717l.15.146L8.5 8.578l2.35 2.284.15-.146L8.65 8.43z'), _path3), ' ']), _uppyIcon), ' ']), _uppyDashboardItemRemove) : null, ' ']), _uppyDashboardItemAction), ' ']), _li;
};
//# sourceMappingURL=FileItem.js.map