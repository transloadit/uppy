/* eslint-disable max-classes-per-file, class-methods-use-this */
/* global AggregateError */
const prettierBytes = require('@transloadit/prettier-bytes')
const match = require('mime-match')

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
  globalThis.AggregateError = class AggregateError extends Error {
    constructor (errors, message) {
      super(message)
      this.errors = errors
    }
  }
}

class AggregateRestrictionError extends AggregateError {
  isRestriction = true
}

class Restricter {
  constructor (opts, i18n) {
    this.opts = opts
    this.i18n = i18n

    if (this.opts.restrictions.allowedFileTypes
        && this.opts.restrictions.allowedFileTypes !== null
        && !Array.isArray(this.opts.restrictions.allowedFileTypes)) {
      throw new TypeError('`restrictions.allowedFileTypes` must be an array')
    }
  }

  validate (file, files) {
    const { maxFileSize, minFileSize, maxTotalFileSize, maxNumberOfFiles, allowedFileTypes } = this.opts.restrictions

    if (maxNumberOfFiles) {
      if (files.length + 1 > maxNumberOfFiles) {
        throw new RestrictionError(`${this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles })}`)
      }
    }

    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.some((type) => {
        // check if this is a mime-type
        if (type.indexOf('/') > -1) {
          if (!file.type) return false
          return match(file.type.replace(/;.*?$/, ''), type)
        }

        // otherwise this is likely an extension
        if (type[0] === '.' && file.extension) {
          return file.extension.toLowerCase() === type.substr(1).toLowerCase()
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
    if (maxFileSize && file.size != null) {
      if (file.size > maxFileSize) {
        throw new RestrictionError(this.i18n('exceedsSize', {
          size: prettierBytes(maxFileSize),
          file: file.name,
        }))
      }
    }

    // We can't check minFileSize if the size is unknown.
    if (minFileSize && file.size != null) {
      if (file.size < minFileSize) {
        throw new RestrictionError(this.i18n('inferiorSize', {
          size: prettierBytes(minFileSize),
        }))
      }
    }
  }

  checkMinNumberOfFiles (files) {
    const { minNumberOfFiles } = this.opts.restrictions
    if (Object.keys(files).length < minNumberOfFiles) {
      throw new RestrictionError(`${this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles })}`)
    }
  }

  checkRequiredMetaFieldsOnFile (file, ctx) {
    const { requiredMetaFields } = this.opts.restrictions
    const own = Object.prototype.hasOwnProperty
    const errors = []
    const missingFields = []

    for (let i = 0; i < requiredMetaFields.length; i++) {
      if (!own.call(file.meta, requiredMetaFields[i]) || file.meta[requiredMetaFields[i]] === '') {
        const err = new RestrictionError(`${this.i18n('missingRequiredMetaFieldOnFile', { fileName: file.name })}`)
        errors.push(err)
        missingFields.push(requiredMetaFields[i])
        ctx.showOrLogErrorAndThrow(err, { file, showInformer: false, throwErr: false })
      }
    }
    ctx.setFileState(file.id, { missingRequiredMetaFields: missingFields })
    return errors
  }

  checkRequiredMetaFields (files, ctx) {
    const errors = Object.keys(files).flatMap((fileID) => {
      const file = ctx.getFile(fileID)
      return this.checkRequiredMetaFieldsOnFile(file, ctx)
    })

    if (errors.length) {
      throw new AggregateRestrictionError(errors, `${this.i18n('missingRequiredMetaField')}`)
    }
  }
}

module.exports = { Restricter, defaultOptions, RestrictionError }
