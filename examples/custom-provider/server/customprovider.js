const request = require('request')

const BASE_URL = 'https://api.unsplash.com'

function adaptData (res) {
  const data = {
    username: null,
    items: [],
    nextPagePath: null,
  }

  const items = res
  items.forEach((item) => {
    const isFolder = !!item.published_at
    data.items.push({
      isFolder,
      icon: isFolder ? item.cover_photo.urls.thumb : item.urls.thumb,
      name: item.title || item.description,
      mimeType: isFolder ? null : 'image/jpeg',
      id: item.id,
      thumbnail: isFolder ? item.cover_photo.urls.thumb : item.urls.thumb,
      requestPath: item.id,
      modifiedDate: item.updated_at,
      size: null,
    })
  })

  return data
}

/**
 * an example of a custom provider module. It implements @uppy/companion's Provider interface
 */
class MyCustomProvider {
  constructor (options) {
    this.authProvider = 'myunsplash'
  }

  list ({ token, directory }, done) {
    const path = directory ? `/${directory}/photos` : ''
    const options = {
      url: `${BASE_URL}/collections${path}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        done(err)
        return
      }

      done(null, adaptData(body))
    })
  }

  download ({ id, token }, onData) {
    const options = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        return
      }

      const url = body.links.download
      request.get(url)
        .on('data', (chunk) => onData(null, chunk))
        .on('end', () => onData(null, null))
        .on('error', (err) => console.log(err))
    })
  }

  size ({ id, token }, done) {
    const options = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    request(options, (err, resp, body) => {
      if (err) {
        console.log(err)
        done(err)
        return
      }

      done(null, body.width * body.height)
    })
  }
}

module.exports = MyCustomProvider
