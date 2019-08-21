const toArray = require('@uppy/utils/lib/toArray')

/*
  SITUATION

    1. Cross-browser dataTransfer.items

      paste in chrome [Copy Image]:
      0: {kind: "file", type: "image/png"}
      1: {kind: "string", type: "text/html"}
      paste in safari [Copy Image]:
      0: {kind: "file", type: "image/png"}
      1: {kind: "string", type: "text/html"}
      2: {kind: "string", type: "text/plain"}
      3: {kind: "string", type: "text/uri-list"}
      paste in firefox [Copy Image]:
      0: {kind: "file", type: "image/png"}
      1: {kind: "string", type: "text/html"}

      paste in chrome [Copy Image Address]:
      0: {kind: "string", type: "text/plain"}
      paste in safari [Copy Image Address]:
      0: {kind: "string", type: "text/plain"}
      1: {kind: "string", type: "text/uri-list"}
      paste in firefox [Copy Image Address]:
      0: {kind: "string", type: "text/plain"}

      drop in chrome [from browser]:
      0: {kind: "string", type: "text/uri-list"}
      1: {kind: "string", type: "text/html"}
      drop in safari [from browser]:
      0: {kind: "string", type: "text/uri-list"}
      1: {kind: "string", type: "text/html"}
      2: {kind: "file", type: "image/png"}
      drop in firefox [from browser]:
      0: {kind: "string", type: "text/uri-list"}
      1: {kind: "string", type: "text/x-moz-url"}
      2: {kind: "string", type: "text/plain"}

    2. We can determine if it's a 'copypaste' or a 'drop', but we can't discern between [Copy Image] and [Copy Image Address].

  CONCLUSION

    1. 'paste' ([Copy Image] or [Copy Image Address], we can't discern between these two)
      Don't do anything if there is 'file' item. .handlePaste in the DashboardPlugin will deal with all 'file' items.
      If there are no 'file' items - handle 'text/plain' items.

    2. 'drop'
      Take 'text/uri-list' items. Safari has an additional item of .kind === 'file', and you may worry about the item being duplicated (first by DashboardPlugin, and then by UrlPlugin, now), but don't. Directory handling code won't pay attention to this particular item of kind 'file'.
*/

/**
 * Finds all links dropped/pasted from one browser window to another.
 *
 * @param {object} dataTransfer - DataTransfer instance, e.g. e.clipboardData, or e.dataTransfer
 * @param {string} isDropOrPaste - either 'drop' or 'paste'
 * @param {Function} callback - (urlString) => {}
 */
module.exports = function forEachDroppedOrPastedUrl (dataTransfer, isDropOrPaste, callback) {
  const items = toArray(dataTransfer.items)

  let urlItems

  switch (isDropOrPaste) {
    case 'paste': {
      const atLeastOneFileIsDragged = items.some((item) => item.kind === 'file')
      if (atLeastOneFileIsDragged) {
        return
      } else {
        urlItems = items.filter((item) =>
          item.kind === 'string' &&
          item.type === 'text/plain'
        )
      }
      break
    }
    case 'drop': {
      urlItems = items.filter((item) =>
        item.kind === 'string' &&
        item.type === 'text/uri-list'
      )
      break
    }
    default: {
      throw new Error(`isDropOrPaste must be either 'drop' or 'paste', but it's ${isDropOrPaste}`)
    }
  }

  urlItems.forEach((item) => {
    item.getAsString((urlString) =>
      callback(urlString)
    )
  })
}
