const request = require('request')
// const { data } = require('autoprefixer')
const BASE_URL = 'https://zoom.us/v2'

/**
 * an example of a custom provider module. It implements @uppy/companion's Provider interface
 */
class ZoomProvider {
  constructor (options) {
    this.authProvider = ZoomProvider.authProvider
  }

  static get authProvider () {
    return 'zoom'
  }

  // /users/{userId}/recordings
  list ({ token, query }, done) {
    const path = '/users/me/recordings'
    const options = {
      url: `${BASE_URL}${path}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        done(err)
        return
      }
      done(null, this._adaptData(body))
    })
  }

  download ({ id, token }, onData) {
    const downloadUrl = id
    const options = {
      url: downloadUrl,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        return
      }
      // how can I test this?
      const url = body.links.download
      request.get(url)
        .on('data', (chunk) => onData(null, chunk))
        .on('end', () => onData(null, null))
        .on('error', (err) => console.log(err))
    })
  }

  size ({ id, token, query }, done) {
    //  it looks like this is required for the get function to work in the companion provider.
    // However, this data is available as part of the initial request, is there a way i can cache the size data, or send it back to client and receive it back here?
    return 10 // arbitrary number for now
  }

  _adaptData (res) {
    const nextPagePath = res && res.nextPagePath ? `/users/me/recordings&next_page_token=${res.nextPagePath}` : ''

    const data = {
      username: null,
      items: [],
      nextPagePath
    }

    if (res.meetings) {
      res.meetings.forEach(meeting => {
        meeting.recording_files.filter(record => record.file_type === 'MP4').forEach((record, index) => {
          data.items.push({
            isFolder: undefined,
            icon: '',
            name: `${meeting.topic}_${record.recording_start}${index > 0 ? `_pt_${index + 1}` : ''}`,
            mimeType: 'video/mp4',
            id: record.download_path,
            thumbnail: '',
            requestPath: record.download_url,
            modifiedDate: record.recording_start,
            size: record.file_size,
            custom: {
              recordTrueId: record.id
            }
          })
        })
      })
    }
    return data
  }

  logout ({ token }, done) {
    const options = {
      url: `${BASE_URL}/oauth/revoke?token=${token}`,
      method: 'POST',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        done(err)
        return
      }
      done(null, this._adaptData(body))
    })
  }
}

module.exports = ZoomProvider
