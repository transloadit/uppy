import nock from 'nock'
import * as defaults from './constants.js'

export const expects = {}

export const nockGoogleDriveAboutCall = () =>
  nock('https://www.googleapis.com')
    .get((uri) => uri.includes('about'))
    .reply(200, { user: { emailAddress: 'john.doe@transloadit.com' } })

export const nockGoogleDownloadFile = ({ times = 2 } = {}) => {
  nock('https://www.googleapis.com')
    .get(
      `/drive/v3/files/${defaults.ITEM_ID}?fields=kind%2Cid%2CimageMediaMetadata%2Cname%2CmimeType%2CownedByMe%2Csize%2CmodifiedTime%2CiconLink%2CthumbnailLink%2CteamDriveId%2CvideoMediaMetadata%2CexportLinks%2CshortcutDetails%28targetId%2CtargetMimeType%29&supportsAllDrives=true`,
    )
    .times(times)
    .reply(200, {
      kind: 'drive#file',
      id: defaults.ITEM_ID,
      name: 'MY DUMMY FILE NAME.mp4',
      mimeType: 'video/mp4',
      iconLink:
        'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
      thumbnailLink: 'https://DUMMY-THUMBNAIL.com/file.jpg',
      modifiedTime: '2016-07-10T20:00:08.096Z',
      ownedByMe: true,
      permissions: [
        { role: 'owner', emailAddress: 'john.doe@transloadit.com' },
      ],
      size: '758051',
    })
  nock('https://www.googleapis.com')
    .get(`/drive/v3/files/${defaults.ITEM_ID}?alt=media&supportsAllDrives=true`)
    .reply(200, {})
  nockGoogleDriveAboutCall()
}
