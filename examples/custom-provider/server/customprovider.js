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
  constructor () {
    this.authProvider = 'myunsplash'
  }

  // eslint-disable-next-line class-methods-use-this
  async list ({ token, directory }) {
    const path = directory ? `/${directory}/photos` : ''
    const options = {
      url: `${BASE_URL}/collections${path}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    return new Promise((resolve, reject) => (
      request(options, (err, resp, body) => {
        if (err) {
          console.log(err)
          reject(err)
          return
        }

        resolve(adaptData(body))
      })))
  }

  // eslint-disable-next-line class-methods-use-this
  async download ({ id, token }) {
    const options = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const resp = await new Promise((resolve, reject) => {
      const req = request(options)
        .on('response', (response) => {
          // Don't allow any more data to flow yet.
          // https://github.com/request/request/issues/1990#issuecomment-184712275
          response.pause()

          if (resp.statusCode !== 200) {
            req.abort() // Or we will leak memory
            reject(new Error(`HTTP response ${resp.statusCode}`))
            return
          }

          resolve(response)
        })
        .on('error', reject)
    })

    // The returned stream will be consumed and uploaded from the current position
    return { stream: resp }
  }

  // eslint-disable-next-line class-methods-use-this
  async size ({ id, token }) {
    const options = {
      url: `${BASE_URL}/photos/${id}`,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    return new Promise((resolve, reject) => (
      request(options, (err, resp, body) => {
        if (err) {
          console.log(err)
          reject(err)
          return
        }

        resolve(body.size)
      })))
  }
}

module.exports = MyCustomProvider
