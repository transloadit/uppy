const semver = require('semver')

/**
 * checks if a version is greater than or equal to
 *
 * @param {string} v1 the LHS version
 * @param {string} v2 the RHS version
 * @returns {boolean}
 */
exports.gte = (v1, v2) => {
  v1 = semver.coerce(v1).version
  v2 = semver.coerce(v2).version

  return semver.gte(v1, v2)
}
