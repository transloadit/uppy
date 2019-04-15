const toArray = require('@uppy/utils/lib/toArray')

/**
 * Finds all links dropped/pasted from one browser window to another.
 *
 * @param {object} dataTransfer - DataTransfer instance, e.g. e.clipboardData, or e.dataTransfer
 * @param {string} type - either 'drop' or 'paste'
 * @param {function} callback - (urlString) => {}
 */
module.exports = function forEachDroppedOrPastedUrl (dataTransfer, type, callback) {
  const items = toArray(dataTransfer.items)

  // [Safari workaround]
  // When file is pasted/dropped
  //   in firefox/chrome: it appears as 2 items with item.kind === 'string'.
  //   in safari: it appears as 3 items, one of .kind === 'file' and two of .kind === 'string'.
  // The 'file' items are handled by the DashboardPlugin, for both dropping and pasting.
  // However, with the introduction of the 'folder drop' functionality, not all items with the .kind === 'file' are caught by the Dashboard plugin.
  if (type === 'paste') {
    // If there is at least one 'file' being dropped, - don't fire the 'url pasted' callback, it's handled by the DashboardPlugin.
    const atLeastOneFileIsDragged = items.some((item) => item.kind === 'file')
    if (atLeastOneFileIsDragged) return
  } else if (type === 'drop') {
    // Always fire the 'url dropped' callback. It MAY be handled by the DashboardPlugin too, resulting in a double item in some browsers, but in most modern browsers it will result in only one item, just like we need it.
  }

  items
    // There are usually 2 identical items with .kind === 'string' returned on paste/drop:
    //  1. with .type === 'text/uri-list' (returned for most browsers), and
    //  2. with .type === 'text/html' or 'text/plain' (varies between browsers).
    .filter((item) => item.kind === 'string' && item.type === 'text/uri-list')
    .forEach((item) => {
      item.getAsString((urlString) =>
        callback(urlString)
      )
    })
}
