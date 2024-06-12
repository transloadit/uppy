// eslint-disable-next-line import/no-extraneous-dependencies
const ftp = require('basic-ftp')
const { PassThrough } = require('node:stream')

const Provider = require('../Provider')
const logger = require('../../logger')
const { ProviderUserError } = require('../error')

// https://stackoverflow.com/questions/7968703/is-there-a-public-ftp-server-to-test-upload-and-download
// https://dlptest.com/ftp-test/

class FtpProvider extends Provider {
  static get hasSimpleAuth () {
    return true
  }

  // eslint-disable-next-line class-methods-use-this
  async #runRequest ({ providerUserSession, operation, autoClose = true }) {
    // todo must protect against both local IP addresses (and dns resolving to local?)
    // const { allowLocalUrls } = this
    /* if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid url')
    } */
    // const { protocol } = new URL(url)
    // const HttpAgentClass = getProtectedHttpAgent({ protocol, blockLocalIPs: !allowLocalUrls })

    const client = new ftp.Client()
    // for debugging:
    // client.ftp.verbose = true

    try {
      await client.access({
        host: providerUserSession.host,
        user: providerUserSession.username,
        password: providerUserSession.password,
        secure: providerUserSession.secure,
      })
      return await operation(client)
    } finally {
      if (autoClose) client.close()
    }
  }

  async list ({ directory, providerUserSession }) {
    const username = `${providerUserSession.username} @ ${providerUserSession.host}`

    const data = await this.#runRequest({
      providerUserSession,
      operation: async (client) => (
        (await client.list(directory || '/')).map((file) => {
          const requestPath = encodeURIComponent(`${directory || ''}/${file.name}`)
          const isFolder = file.isDirectory

          return {
            isFolder,
            id: file.uniqueID || requestPath,
            icon: isFolder ? 'folder' : 'file',
            name: file.name,
            requestPath,
            modifiedDate: file.rawModifiedAt,
            ...(!isFolder && {
              size: file.size,
              thumbnail: null,
            }),
          }
        })
      ),
    })

    return { items: data, username }
  }

  async download ({ id, providerUserSession }) {
    return this.#runRequest({
      providerUserSession,
      operation: async (client) => {
        const stream = new PassThrough()
        client.downloadTo(stream, `/${id}`).catch((err) => {
          logger.error(err, 'provider.ftp.download.error')
          stream.emit('error', err)
        }).finally(() => {
          client.close()
        })

        return { stream }
      },
      autoClose: false,
    })
  }

  // eslint-disable-next-line class-methods-use-this
  async size () {
    return 0 // todo
  }

  // eslint-disable-next-line
  async thumbnail ({ id, providerUserSession }) {
    throw new Error('call to thumbnail is not implemented')
  }

  async simpleAuth ({ requestBody: { form } }) {
    try {
      const { host, username, password } = form

      const protocol = form.protocol || 'ftp'
      if (!['ftp', 'ftps'].includes(protocol)) throw new ProviderUserError({ message: 'Invalid protocol' })

      const providerUserSession = {
        host,
        username,
        password,
        secure: protocol === 'ftps',
        protocol,
      }

      // this will verify the credentials
      await this.#runRequest({
        providerUserSession,
        operation: async (client) => client.list('/'),
      })

      return providerUserSession
    } catch (err) {
      logger.error(err, 'provider.ftp.simpleAuth.error')
      if (['ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) {
        throw new ProviderUserError({ message: 'Cannot connect to FTP server' })
      }
      if (err instanceof ftp.FTPError && [503, 530].includes(err.code)) {
        throw new ProviderUserError({ message: 'Incorrect username or password' })
      }
      if (err instanceof ftp.FTPError) {
        throw new ProviderUserError({ message: err.message })
      }
      throw err
    }
  }
}

module.exports = FtpProvider
