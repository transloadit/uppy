module.exports.responses = {
  'https://zoom.us/v2/users/me': {
    get: {
      id: 'DUMMY-USER-ID',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@transloadit.com',
      timezone: '',
      dept: '',
      created_at: '2020-07-21T09:13:30Z',
      last_login_time: '2020-10-12T07:55:02Z',
      group_ids: [],
      im_group_ids: [],
      account_id: 'DUMMY-ACCOUNT-ID',
      language: 'en-US',
    },
  },
  'https://zoom.us/v2/meetings/DUMMY-UUID%3D%3D/recordings': {
    get: {
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
    },
  },
  'https://us02web.zoom.us/rec/play/DUMMY-DOWNLOAD-PATH': {
    get: {},
  },
  'https://api.zoom.us/oauth/data/compliance': {
    post: {},
  },
  'https://zoom.us/oauth/revoke': {
    post: {},
  },
}

module.exports.expects = {
  listPath: 'DUMMY-UUID%3D%3D',
  itemName: 'DUMMY TOPIC - shared screen with speaker view (2020-05-29, 13:23).mp4',
  itemId: 'DUMMY-UUID%3D%3D__DUMMY-FILE-ID',
  itemRequestPath: 'DUMMY-UUID%3D%3D?recordingId=DUMMY-FILE-ID',
  itemIcon: 'video',
  remoteZoomKey: 'REMOTE-ZOOM-KEY',
  remoteZoomSecret: 'REMOTE-ZOOM-SECRET',
  remoteZoomVerificationToken: 'REMOTE-ZOOM-VERIFICATION-TOKEN',
}

module.exports.validators = {
  'https://zoom.us/oauth/revoke': ({ headers }) => {
    if (process.env.COMPANION_ZOOM_KEYS_ENDPOINT) {
      const auth = `${module.exports.expects.remoteZoomKey}:${module.exports.expects.remoteZoomSecret}`
      return headers.Authorization === `Basic ${Buffer.from(auth, 'binary').toString('base64')}`
    }

    return true
  },
}
