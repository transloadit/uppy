import { describe, expect, it } from '@jest/globals'
import isMobileDevice from './isMobileDevice.js'

let fakeUserAgent = null

Object.defineProperty(globalThis.navigator, 'userAgent', {
  get () {
    return fakeUserAgent
  },
})

function setUserAgent (userAgent) {
  fakeUserAgent = userAgent
}

describe('isMobileDevice', () => {
  it('should return true if the specified user agent is mobile', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1')
    expect(isMobileDevice()).toEqual(true)
    setUserAgent('Mozilla/5.0 (Linux; Android 7.0; SM-G570M Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/69.0.3497.100 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/192.0.0.34.85;]')
    expect(isMobileDevice()).toEqual(true)
  })

  it('should return false if the user agent is not mobile', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko)')
    expect(isMobileDevice()).toEqual(false)
    setUserAgent('Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.1 TV Safari/538.1')
    expect(isMobileDevice()).toEqual(false)
  })
})
