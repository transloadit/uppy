import prettierBytes from '@transloadit/prettier-bytes'
import type { I18n } from '@uppy/utils/lib/Translator'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
// @ts-ignore untyped
import match from 'mime-match'
import type { NonNullableUppyOptions, State } from './Uppy.js'

export type Restrictions = {
  maxFileSize: number | null
  minFileSize: number | null
  maxTotalFileSize: number | null
  maxNumberOfFiles: number | null
  minNumberOfFiles: number | null
  allowedFileTypes: string[] | null
  requiredMetaFields: string[]
}

/**
 * The minimal required properties to be present from UppyFile in order to validate it.
 */
export type ValidateableFile<M extends Meta, B extends Body> = Pick<
  UppyFile<M, B>,
  'type' | 'extension' | 'size' | 'name'
  // Both UppyFile and CompanionFile need to be passable as a ValidateableFile
  // CompanionFile's do not have `isGhost`, so we mark it optional.
> & { isGhost?: boolean }

const defaultOptions = {
  maxFileSize: null,
  minFileSize: null,
  maxTotalFileSize: null,
  maxNumberOfFiles: null,
  minNumberOfFiles: null,
  allowedFileTypes: null,
  requiredMetaFields: [],
}

class RestrictionError<M extends Meta, B extends Body> extends Error {
  isUserFacing: boolean

  file!: UppyFile<M, B>

  constructor(
    message: string,
    opts?: { isUserFacing?: boolean; file?: UppyFile<M, B> },
  ) {
    super(message)
    this.isUserFacing = opts?.isUserFacing ?? true
    if (opts?.file) {
      this.file = opts.file // only some restriction errors are related to a particular file
    }
  }

  isRestriction = true
}

class Restricter<M extends Meta, B extends Body> {
  getI18n: () => I18n

  getOpts: () => NonNullableUppyOptions<M, B>

  constructor(
    getOpts: () => NonNullableUppyOptions<M, B>,
    getI18n: () => I18n,
  ) {
    this.getI18n = getI18n
    this.getOpts = (): NonNullableUppyOptions<M, B> => {
      const opts = getOpts()

      if (
        opts.restrictions?.allowedFileTypes != null &&
        !Array.isArray(opts.restrictions.allowedFileTypes)
      ) {
        throw new TypeError('`restrictions.allowedFileTypes` must be an array')
      }
      return opts
    }
  }

  // Because these operations are slow, we cannot run them for every file (if we are adding multiple files)
  validateAggregateRestrictions(
    existingFiles: ValidateableFile<M, B>[],
    addingFiles: ValidateableFile<M, B>[],
  ): void {
    const { maxTotalFileSize, maxNumberOfFiles } = this.getOpts().restrictions

    if (maxNumberOfFiles) {
      const nonGhostFiles = existingFiles.filter((f) => !f.isGhost)
      if (nonGhostFiles.length + addingFiles.length > maxNumberOfFiles) {
        throw new RestrictionError(
          `${this.getI18n()('youCanOnlyUploadX', {
            smart_count: maxNumberOfFiles,
          })}`,
        )
      }
    }

    if (maxTotalFileSize) {
      const totalFilesSize = [...existingFiles, ...addingFiles].reduce(
        (total, f) => total + (f.size ?? 0),
        0,
      )
      if (totalFilesSize > maxTotalFileSize) {
        throw new RestrictionError(
          this.getI18n()('aggregateExceedsSize', {
            sizeAllowed: prettierBytes(maxTotalFileSize),
            size: prettierBytes(totalFilesSize),
          }),
        )
      }
    }
  }

  validateSingleFile(file: ValidateableFile<M, B>): void {
    const { maxFileSize, minFileSize, allowedFileTypes } =
      this.getOpts().restrictions

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
        throw new RestrictionError(
          this.getI18n()('youCanOnlyUploadFileTypes', {
            types: allowedFileTypesString,
          }),
          { file } as { file: UppyFile<M, B> },
        )
      }
    }

    // We can't check maxFileSize if the size is unknown.
    if (maxFileSize && file.size != null && file.size > maxFileSize) {
      throw new RestrictionError(
        this.getI18n()('exceedsSize', {
          size: prettierBytes(maxFileSize),
          file: file.name ?? this.getI18n()('unnamed'),
        }),
        { file } as { file: UppyFile<M, B> },
      )
    }

    // We can't check minFileSize if the size is unknown.
    if (minFileSize && file.size != null && file.size < minFileSize) {
      throw new RestrictionError(
        this.getI18n()('inferiorSize', {
          size: prettierBytes(minFileSize),
        }),
        { file } as { file: UppyFile<M, B> },
      )
    }
  }

  validate(
    existingFiles: ValidateableFile<M, B>[],
    addingFiles: ValidateableFile<M, B>[],
  ): void {
    addingFiles.forEach((addingFile) => {
      this.validateSingleFile(addingFile)
    })
    this.validateAggregateRestrictions(existingFiles, addingFiles)
  }

  validateMinNumberOfFiles(files: State<M, B>['files']): void {
    const { minNumberOfFiles } = this.getOpts().restrictions
    if (minNumberOfFiles && Object.keys(files).length < minNumberOfFiles) {
      throw new RestrictionError(
        this.getI18n()('youHaveToAtLeastSelectX', {
          smart_count: minNumberOfFiles,
        }),
      )
    }
  }

  getMissingRequiredMetaFields(file: ValidateableFile<M, B> & { meta: M }): {
    missingFields: string[]
    error: RestrictionError<M, B>
  } {
    const error = new RestrictionError<M, B>(
      this.getI18n()('missingRequiredMetaFieldOnFile', {
        fileName: file.name ?? this.getI18n()('unnamed'),
      }),
    )
    const { requiredMetaFields } = this.getOpts().restrictions
    const missingFields: string[] = []

    for (const field of requiredMetaFields) {
      if (!Object.hasOwn(file.meta, field) || file.meta[field] === '') {
        missingFields.push(field)
      }
    }

    return { missingFields, error }
  }
}

export { Restricter, defaultOptions, RestrictionError }
