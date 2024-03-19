import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { AssemblyParameters, Opts, AssemblyOptions as Options } from '.'

/**
 * Check that Assembly parameters are present and include all required fields.
 */
function validateParams(params?: AssemblyParameters | null): void {
  if (params == null) {
    throw new Error('Transloadit: The `params` option is required.')
  }

  if (typeof params === 'string') {
    try {
      // eslint-disable-next-line no-param-reassign
      params = JSON.parse(params)
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      throw new ErrorWithCause(
        'Transloadit: The `params` option is a malformed JSON string.',
        { cause: err },
      )
    }
  }

  if (!params!.auth || !params!.auth.key) {
    throw new Error(
      'Transloadit: The `params.auth.key` option is required. ' +
        'You can find your Transloadit API key at https://transloadit.com/c/template-credentials',
    )
  }
}
export type OptionsWithRestructuredFields = Omit<Options, 'fields'> & {
  fields: Record<string, string | number>
}

/**
 * Combine Assemblies with the same options into a single Assembly for all the
 * relevant files.
 */
function dedupe(
  list: Array<
    { fileIDs: string[]; options: OptionsWithRestructuredFields } | undefined
  >,
) {
  const dedupeMap: Record<
    string,
    { fileIDArrays: string[][]; options: OptionsWithRestructuredFields }
  > = Object.create(null)
  for (const { fileIDs, options } of list.filter(Boolean) as Array<{
    fileIDs: string[]
    options: OptionsWithRestructuredFields
  }>) {
    const id = JSON.stringify(options)
    if (id in dedupeMap) {
      dedupeMap[id].fileIDArrays.push(fileIDs)
    } else {
      dedupeMap[id] = {
        options,
        fileIDArrays: [fileIDs],
      }
    }
  }

  return Object.values(dedupeMap).map(({ options, fileIDArrays }) => ({
    options,
    fileIDs: fileIDArrays.flat(1),
  }))
}

async function getAssemblyOptions<M extends Meta, B extends Body>(
  file: UppyFile<M, B> | null,
  options: Opts<M, B>,
): Promise<OptionsWithRestructuredFields> {
  const assemblyOptions = (
    typeof options.assemblyOptions === 'function' ?
      await options.assemblyOptions(file, options)
    : options.assemblyOptions) as OptionsWithRestructuredFields

  validateParams(assemblyOptions.params)

  const { fields } = assemblyOptions
  if (Array.isArray(fields)) {
    assemblyOptions.fields =
      file == null ?
        {}
      : Object.fromEntries(
          fields.map((fieldName) => [fieldName, file.meta[fieldName]]),
        )
  } else if (fields == null) {
    assemblyOptions.fields = {}
  }

  return assemblyOptions
}

/**
 * Turn Transloadit plugin options and a list of files into a list of Assembly
 * options.
 */
class AssemblyOptions<M extends Meta, B extends Body> {
  opts: Opts<M, B>

  files: UppyFile<M, B>[]

  constructor(files: UppyFile<M, B>[], opts: Opts<M, B>) {
    this.files = files
    this.opts = opts
  }

  /**
   * Generate a set of Assemblies that will handle the upload.
   * Returns a Promise for an object with keys:
   *  - fileIDs - an array of file IDs to add to this Assembly
   *  - options - Assembly options
   */
  async build(): Promise<
    { fileIDs: string[]; options: OptionsWithRestructuredFields }[]
  > {
    const options = this.opts

    if (this.files.length > 0) {
      return Promise.all(
        this.files.map(async (file) => {
          if (file == null) return undefined

          const assemblyOptions = await getAssemblyOptions(file, options)

          // We check if the file is present here again, because it could had been
          // removed during the await, e.g. if the user hit cancel while we were
          // waiting for the options.
          if (file == null) return undefined

          return {
            fileIDs: [file.id],
            options: assemblyOptions,
          }
        }),
      ).then(dedupe)
    }

    if (options.alwaysRunAssembly) {
      // No files, just generate one Assembly
      const assemblyOptions = await getAssemblyOptions(null, options)

      return [
        {
          fileIDs: [],
          options: assemblyOptions,
        },
      ]
    }

    // If there are no files and we do not `alwaysRunAssembly`,
    // don't do anything.
    return []
  }
}

export default AssemblyOptions
export { validateParams }
