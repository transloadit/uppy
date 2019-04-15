const toArray = require('@uppy/utils/lib/toArray')

function readEntries (entry, reader, oldEntries, cb) {
  const dirReader = reader || entry.createReader()
  dirReader.readEntries(function (entries) {
    const newEntries = oldEntries ? oldEntries.concat(entries) : entries
    if (entries.length) {
      setTimeout(() => {
        readEntries(entry, dirReader, newEntries, cb)
      }, 0)
    } else {
      cb(newEntries)
    }
  })
}

function readDirectory (files, entry, resolve) {
  readEntries(entry, 0, 0, function (entries) {
    const promises = []
    entries.forEach(function (entry) {
      promises.push(new Promise(function (resolve) {
        if (entry.isFile) {
          entry.file(function (file) {
            files.push(file)
            resolve()
          }, resolve)
        } else if (entry.isDirectory) {
          readDirectory(files, entry, resolve)
        }
      }))
    })
    Promise.all(promises).then(resolve)
  })
}

// Old drag and drop API implemented in Chrome 11+
// Explanation: https://stackoverflow.com/a/50030399/3192470
module.exports = function webkitGetAsEntryApi (dataTransfer, cb) {
  const files = []

  const rootPromises = []
  toArray(dataTransfer.items).forEach(function (entry) {
    entry = entry.webkitGetAsEntry()
    if (entry) {
      rootPromises.push(new Promise(function (resolve) {
        if (entry.isFile) {
          entry.file(function (file) {
            files.push(file)
            resolve()
          }, resolve)
        } else if (entry.isDirectory) {
          readDirectory(files, entry, resolve)
        }
      }))
    }
  })
  Promise.all(rootPromises).then(() => cb(files))
}
