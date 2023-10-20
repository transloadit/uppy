// eslint-disable-next-line import/no-extraneous-dependencies
const { XMLParser } = require('fast-xml-parser')

const WebdavProvider = require('./common')
const { getProtectedGot, validateURL } = require('../../helpers/request')

const cloudTypePathMappings = {
  nextcloud: {
    manual_revoke_url: '/settings/user/security',
  },
  owncloud: {
    manual_revoke_url: '/settings/personal?sectionid=security',
  },
}

class WebdavOauth extends WebdavProvider {
  constructor (options) {
    super(options)
    this.authProvider = WebdavOauth.authProvider
  }

  // for "grant"
  static getExtraConfig () {
    return {}
  }

  // eslint-disable-next-line class-methods-use-this
  static grantDynamicToUserSession ({ grantDynamic }) {
    return {
      subdomain: grantDynamic.subdomain,
    }
  }

  static get authProvider () {
    return 'webdav'
  }

  #getBaseUrl ({ providerUserSession: { subdomain } }) {
    const { protocol } = this.providerOptions

    return `${protocol}://${subdomain}`
  }

  // eslint-disable-next-line class-methods-use-this
  isAuthenticated ({ providerUserSession }) {
    return providerUserSession.subdomain != null
  }

  async getUsername ({ token, providerUserSession }) {
    const { allowLocalUrls } = this

    const url = `${this.#getBaseUrl({ providerUserSession })}/ocs/v1.php/cloud/user`
    if (!validateURL(url, allowLocalUrls)) {
      throw new Error('invalid user url')
    }

    const response = await getProtectedGot({ url, blockLocalIPs: !allowLocalUrls }).get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).text()

    const parser = new XMLParser()
    const data = parser.parse(response)
    return data?.ocs?.data?.id
  }

  async getClient ({ username, token, providerUserSession }) {
    const url = `${this.#getBaseUrl({ providerUserSession })}/remote.php/dav/files/${username}`

    const { AuthType } = await import('webdav') // eslint-disable-line import/no-unresolved
    return this.getClientHelper({
      url,
      authType: AuthType.Token,
      token: {
        access_token: token,
        token_type: 'Bearer',
      },
    })
  }

  async logout ({ providerUserSession }) {
    const { cloudType } = providerUserSession
    const manual_revoke_url = cloudTypePathMappings[cloudType]?.manual_revoke_url
    return {
      revoked: false,
      ...(manual_revoke_url && { manual_revoke_url: `${this.#getBaseUrl({ providerUserSession })}${manual_revoke_url}` }),
    }
  }
}

module.exports = WebdavOauth
