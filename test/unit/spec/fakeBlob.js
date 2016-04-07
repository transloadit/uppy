/*
 * A fake blob used in tests since not every browser supports Blob yet.
 *
 * @param {Array} blob
 */
function FakeBlob (blob) {
  this._blob = blob
  this.size = blob.length
}

FakeBlob.prototype.slice = function (start, end) {
  return new FakeBlob(this._blob.slice(start, end))
}

FakeBlob.prototype.stringify = function () {
  return this._blob.join('')
}
