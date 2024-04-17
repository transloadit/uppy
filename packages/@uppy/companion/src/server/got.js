// eslint-disable-next-line import/no-unresolved
const gotPromise = import('got')

module.exports = gotPromise.then((got) => got.default)
