/* eslint-disable max-classes-per-file, class-methods-use-this */
/* global AggregateError */
import prettierBytes from '@transloadit/prettier-bytes'
import match from 'mime-match'

const defaultOptions = {
  maxFileSize: null,
  minFileSize: null,
  maxTotalFileSize: null,
  maxNumberOfFiles: null,
  minNumberOfFiles: null,
  allowedFileTypes: null,
  requiredMetaFields: [],
}

class RestrictionError extends Error {
  isRestriction = true
}

if (typeof AggregateError === 'undefined') {
  // eslint-disable-next-line no-global-assign
  // TODO: remove this "polyfill" in the next major.
  globalThis.AggregateError = class AggregateError extends Error {
    constructor (errors, message) {
      super(message)
      this.errors = errors
    }
  }
}

class Restricter {
  constructor (getOpts, i18n) {
    this.i18n = i18n
    this.getOpts = () => {
      const opts = getOpts()

      if (opts.restrictions.allowedFileTypes != null
          && !Array.isArray(opts.restrictions.allowedFileTypes)) {
        throw new TypeError('`restrictions.allowedFileTypes` must be an array')
      }
      return opts
    }
  }

  validate (file, files) {
    const { maxFileSize, minFileSize, maxTotalFileSize, maxNumberOfFiles, allowedFileTypes } = this.getOpts().restrictions

    if (maxNumberOfFiles) {
      const nonGhostFiles = files.filter(f => !f.isGhost)
      if (nonGhostFiles.length + 1 > maxNumberOfFiles) {
        throw new RestrictionError(`${this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles })}`)
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.some((type) => {
        // check if this is a mime-type
        if (type.includes('/')) {
          if (!file.type) return false
          return match(file.type.replace(/;.*?$/, ''), type)
        }

        // otherwise this is likely an extension
        if (type[0] === '.' && file.extension) {
          return file.extension.toLowerCase() === type.slice(1).toLowerCase()
        }
        return false
      })

      if (!isCorrectFileType) {
        const allowedFileTypesString = allowedFileTypes.join(', ')
        throw new RestrictionError(this.i18n('youCanOnlyUploadFileTypes', { types: allowedFileTypesString }))
      }
    }

    // We can't check maxTotalFileSize if the size is unknown.
    if (maxTotalFileSize && file.size != null) {
      const totalFilesSize = files.reduce((total, f) => (total + f.size), file.size)

      if (totalFilesSize > maxTotalFileSize) {
        throw new RestrictionError(this.i18n('exceedsSize', {
          size: prettierBytes(maxTotalFileSize),
          file: file.name,
        }))
      }
    }

    // We can't check maxFileSize if the size is unknown.
    if (maxFileSize && file.size != null && file.size > maxFileSize) {
      throw new RestrictionError(this.i18n('exceedsSize', {
        size: prettierBytes(maxFileSize),
        file: file.name,
      }))
    }

    // We can't check minFileSize if the size is unknown.
    if (minFileSize && file.size != null && file.size < minFileSize) {
      throw new RestrictionError(this.i18n('inferiorSize', {
        size: prettierBytes(minFileSize),
      }))
    }
  }

  validateMinNumberOfFiles (files) {
    const { minNumberOfFiles } = this.getOpts().restrictions
    if (Object.keys(files).length < minNumberOfFiles) {
      throw new RestrictionError(this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles }))
    }
  }

  getMissingRequiredMetaFields (file) {
    const error = new RestrictionError(this.i18n('missingRequiredMetaFieldOnFile', { fileName: file.name }))
    const { requiredMetaFields } = this.getOpts().restrictions
    // TODO: migrate to Object.hasOwn in the next major.
    const own = Object.prototype.hasOwnProperty
    const missingFields = []

    for (const field of requiredMetaFields) {
      if (!own.call(file.meta, field) || file.meta[field] === '') {
        missingFields.push(field)
      }
    }

    return { missingFields, error }
  }
}

export { Restricter, defaultOptions, RestrictionError }
