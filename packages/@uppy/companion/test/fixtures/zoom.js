const nock = require('nock')

const { getBasicAuthHeader } = require('../../src/server/helpers/utils')

module.exports.expects = {
  listPath: 'DUMMY-UUID%3D%3D',
  itemName: 'DUMMY TOPIC - shared screen with speaker view (2020-05-29, 13:23).mp4',
  itemId: 'DUMMY-UUID%3D%3D__DUMMY-FILE-ID',
  itemRequestPath: 'DUMMY-UUID%3D%3D?recordingId=DUMMY-FILE-ID',
  itemIcon: 'video',
  localZoomKey: 'zoom_key',
  localZoomSecret: 'zoom_secret',
  localZoomVerificationToken: 'zoom_verfication_token',
  remoteZoomKey: 'REMOTE-ZOOM-KEY',
  remoteZoomSecret: 'REMOTE-ZOOM-SECRET',
  remoteZoomVerificationToken: 'REMOTE-ZOOM-VERIFICATION-TOKEN',
}

module.exports.nockZoomRecordings = ({ times = 1 } = {}) => {
  nock('https://zoom.us').get('/v2/meetings/DUMMY-UUID%3D%3D/recordings').times(times).reply(200, {
    uuid: 'DUMMY-UUID==',
    id: 12345678900,
    account_id: 'DUMMY-ACCOUNT-ID',
    host_id: 'DUMMY-HOST-ID',
    topic: 'DUMMY TOPIC',
    type: 2,
    start_time: '2020-05-29T13:19:40Z',
    timezone: 'Europe/Amsterdam',
    duration: 0,
    total_size: 723389,
    recording_count: 4,
    recording_files:
      [
        {
          id: 'DUMMY-FILE-ID',
          meeting_id: 'DUMMY-UUID==',
          recording_start: '2020-05-29T13:23:57Z',
          recording_end: '2020-05-29T13:24:02Z',
          file_type: 'MP4',
          file_size: 758051,
          play_url: 'https://us02web.zoom.us/rec/play/DUMMY-DOWNLOAD-PATH',
          download_url: 'https://us02web.zoom.us/rec/download/DUMMY-DOWNLOAD-PATH',
          status: 'completed',
          recording_type: 'shared_screen_with_speaker_view',
        },
      ],
  })
}

module.exports.nockZoomRevoke = ({ key, secret }) => {
  // eslint-disable-next-line func-names
  nock('https://zoom.us').post('/oauth/revoke?token=token+value').reply(function () {
    const { headers } = this.req

    const expected = getBasicAuthHeader(key, secret)
    const success = headers.authorization === expected
    return success ? [200, { status: 'success' }] : [400]
  })
}
