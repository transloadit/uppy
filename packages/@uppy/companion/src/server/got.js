const gotPromise = import('got')

module.exports = gotPromise.then((got) => got.default)
