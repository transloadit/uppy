import { parser } from 'sax'

/**
 * Bound the XML tree the WebDAV library will build. A byte limit alone still
 * permits hundreds of thousands of tiny attributes or recursive elements.
 * This SAX pass retains only the current element and rejects DTDs entirely.
 */
export function validateResponseXml(xml: string): void {
  const xmlParser = parser(true)
  let depth = 0
  let elements = 0
  let attributes = 0
  let elementAttributes = 0
  const refuse = () => {
    throw new Error('WebDAV XML response exceeds structural limits')
  }
  xmlParser.onopentagstart = () => {
    depth++
    elements++
    elementAttributes = 0
    if (depth > 64 || elements > 50000) refuse()
  }
  xmlParser.onattribute = () => {
    attributes++
    elementAttributes++
    if (attributes > 10000 || elementAttributes > 64) refuse()
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
