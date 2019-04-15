// API implemented in Firefox 42+ and Edge
module.exports = function getFilesAndDirectoriesApi (input, cb) {
  const files = []

  const iterate = function (entries, path, resolve) {
    const promises = []
    entries.forEach(function (entry) {
      promises.push(new Promise(function (resolve) {
        if ('getFilesAndDirectories' in entry) {
          entry.getFilesAndDirectories().then(function (entries) {
            iterate(entries, entry.path + '/', resolve)
          })
        } else {
          files.push(entry)
          resolve()
        }
      }))
    })
    Promise.all(promises).then(resolve)
  }
  input.getFilesAndDirectories()
    .then((entries) => {
      new Promise(function (resolve) {
        iterate(entries, '/', resolve)
      }).then(() => cb(files))
    })
}
