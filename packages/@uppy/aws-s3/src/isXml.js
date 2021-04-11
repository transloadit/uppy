/**
 * Remove parameters like `charset=utf-8` from the end of a mime type string.
 *
 * @param {string} mimeType - The mime type string that may have optional parameters.
 * @returns {string} The "base" mime type, i.e. only 'category/type'.
 */
function removeMimeParameters (mimeType) {
  return mimeType.replace(/;.*$/, '')
}

/**
 * Check if a response contains XML based on the response object and its text content.
 *
 * @param {string} content - The text body of the response.
 * @param {object|XMLHttpRequest} xhr - The XHR object or response object from Companion.
 * @returns {bool} Whether the content is (probably) XML.
 */
function isXml (content, xhr) {
  const rawContentType = (xhr.headers ? xhr.headers['content-type'] : xhr.getResponseHeader('Content-Type'))

  if (typeof rawContentType === 'string') {
    const contentType = removeMimeParameters(rawContentType).toLowerCase()
    if (contentType === 'application/xml' || contentType === 'text/xml') {
      return true
    }
    // GCS uses text/html for some reason
    // https://github.com/transloadit/uppy/issues/896
    if (contentType === 'text/html' && /^<\?xml /.test(content)) {
      return true
    }
  }
  return false
}

module.exports = isXml
