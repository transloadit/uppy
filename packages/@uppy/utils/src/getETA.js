const getSpeed = require('./getSpeed')
const getBytesRemaining = require('./getBytesRemaining')

module.exports = function getETA (fileProgress) {
  if (!fileProgress.bytesUploaded) return 0

  const uploadSpeed = getSpeed(fileProgress)
  const bytesRemaining = getBytesRemaining(fileProgress)
  const secondsRemaining = Math.round(bytesRemaining / uploadSpeed * 10) / 10

  return secondsRemaining
}
