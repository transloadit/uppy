const nock = require('nock')
const defaults = require('./constants')

module.exports.expects = {}

module.exports.nockGoogleDownloadFile = ({ times = 1 } = {}) => {
  nock('https://www.googleapis.com').get(`/drive/v3/files/${defaults.ITEM_ID}?fields=kind%2Cid%2CimageMediaMetadata%2Cname%2CmimeType%2CownedByMe%2Cpermissions%28role%2CemailAddress%29%2Csize%2CmodifiedTime%2CiconLink%2CthumbnailLink%2CteamDriveId%2CvideoMediaMetadata%2CshortcutDetails%28targetId%2CtargetMimeType%29&supportsAllDrives=true`).times(times).reply(200, {
    kind: 'drive#file',
    id: defaults.ITEM_ID,
    name: 'MY DUMMY FILE NAME.mp4',
    mimeType: 'video/mp4',
    iconLink: 'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
    thumbnailLink: 'https://DUMMY-THUMBNAIL.com/file.jpg',
    modifiedTime: '2016-07-10T20:00:08.096Z',
    ownedByMe: true,
    permissions: [{ role: 'owner', emailAddress: 'john.doe@transloadit.com' }],
    size: '758051',
  })
  nock('https://www.googleapis.com').get(`/drive/v3/files/${defaults.ITEM_ID}?alt=media&supportsAllDrives=true`).reply(200, {})
}
