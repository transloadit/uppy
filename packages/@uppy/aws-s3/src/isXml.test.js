const isXml = require('./isXml')

describe('AwsS3', () => {
  describe('isXml', () => {
    it('returns true for XML documents', () => {
      const content = '<?xml version="1.0" encoding="UTF-8"?><Key>image.jpg</Key>'
      expect(isXml(content, {
        getResponseHeader: () => 'application/xml'
      })).toEqual(true)
      expect(isXml(content, {
        getResponseHeader: () => 'text/xml'
      })).toEqual(true)
      expect(isXml(content, {
        getResponseHeader: () => 'text/xml; charset=utf-8'
      })).toEqual(true)
      expect(isXml(content, {
        getResponseHeader: () => 'application/xml; charset=iso-8859-1'
      })).toEqual(true)
    })

    it('returns true for GCS XML documents', () => {
      const content = '<?xml version="1.0" encoding="UTF-8"?><Key>image.jpg</Key>'
      expect(isXml(content, {
        getResponseHeader: () => 'text/html'
      })).toEqual(true)
      expect(isXml(content, {
        getResponseHeader: () => 'text/html; charset=utf8'
      })).toEqual(true)
    })

    it('returns true for remote response objects', () => {
      const content = '<?xml version="1.0" encoding="UTF-8"?><Key>image.jpg</Key>'
      expect(isXml(content, {
        headers: { 'content-type': 'application/xml' }
      })).toEqual(true)
      expect(isXml(content, {
        headers: { 'content-type': 'application/xml' }
      })).toEqual(true)
      expect(isXml(content, {
        headers: { 'content-type': 'text/html' }
      })).toEqual(true)
    })

    it('returns false when content-type is missing', () => {
      const content = '<?xml version="1.0" encoding="UTF-8"?><Key>image.jpg</Key>'
      expect(isXml(content, {
        getResponseHeader: () => null
      })).toEqual(false)
      expect(isXml(content, {
        headers: { 'content-type': null }
      })).toEqual(false)
      expect(isXml(content, {
        headers: {}
      })).toEqual(false)
    })

    it('returns false for HTML documents', () => {
      const content = '<!DOCTYPE html><html>'
      expect(isXml(content, {
        getResponseHeader: () => 'text/html'
      })).toEqual(false)
    })
  })
})
