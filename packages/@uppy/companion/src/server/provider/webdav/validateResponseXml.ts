import sax from 'sax'

/**
 * Bound the XML tree the WebDAV library will build. The 5 MiB byte limit alone
 * still permits about a million tiny or deeply nested elements, or a few
 * elements with hundreds of thousands of attributes. This SAX pass keeps no
 * state but the counts, and rejects DTDs (entity expansion) entirely.
 *
 * A real listing has about 10-14 elements per entry, so 250,000 elements leave
 * room for any listing that fits the byte limit. Attributes are only bounded
 * per element, not in total: Apache and IIS declare namespaces on every
 * <response>.
 */
export function validateResponseXml(xml: string): void {
  const xmlParser = sax.parser(true)
  let depth = 0
  let elements = 0
  let elementAttributes = 0
  const refuse = () => {
    throw new Error('WebDAV XML response exceeds structural limits')
  }
  xmlParser.onopentagstart = () => {
    depth++
    elements++
    elementAttributes = 0
    if (depth > 64 || elements > 250_000) refuse()
  }
  xmlParser.onattribute = () => {
    elementAttributes++
    if (elementAttributes > 64) refuse()
  }
  xmlParser.onclosetag = () => {
    depth--
  }
  xmlParser.ondoctype = refuse
  xmlParser.onerror = () => {
    throw new Error('Invalid WebDAV XML response')
  }
  xmlParser.write(xml).close()
}
