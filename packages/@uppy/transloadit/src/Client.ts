import type {
  RateLimitedQueue,
  WrapPromiseFunctionType,
} from '@uppy/utils/lib/RateLimitedQueue'
import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError'
import type { AssemblyResponse } from '.'
import type { OptionsWithRestructuredFields } from './AssemblyOptions'

const ASSEMBLIES_ENDPOINT = '/assemblies'

type Opts = {
  client?: string
  service: string
  rateLimitedQueue: RateLimitedQueue
  errorReporting: boolean
}

export class AssemblyError extends Error {
  details: string | undefined

  assembly: AssemblyResponse

  constructor(
    message: string,
    details: string | undefined,
    assembly: AssemblyResponse,
  ) {
    super(message)
    this.details = details
    this.assembly = assembly
  }
}

/**
 * A Barebones HTTP API client for Transloadit.
 */
export default class Client<M extends Meta, B extends Body> {
  #headers: Record<string, string> = {}

  #fetchWithNetworkError: WrapPromiseFunctionType<typeof fetchWithNetworkError>

  opts: Opts

  constructor(opts: Opts) {
    this.opts = opts

    if (this.opts.client != null) {
      this.#headers['Transloadit-Client'] = this.opts.client
    }

    this.#fetchWithNetworkError =
      this.opts.rateLimitedQueue.wrapPromiseFunction(fetchWithNetworkError)
  }

  async #fetchJSON(
    ...args: Parameters<typeof fetchWithNetworkError>
  ): Promise<AssemblyResponse> {
    const response = await this.#fetchWithNetworkError(...args)

    if (response.status === 429) {
      this.opts.rateLimitedQueue.rateLimit(2_000)
      return this.#fetchJSON(...args)
    }

    if (!response.ok) {
      const serverError = new Error(response.statusText)
      // @ts-expect-error statusCode is not a standard property
      serverError.statusCode = response.status

      if (!`${args[0]}`.endsWith(ASSEMBLIES_ENDPOINT))
        return Promise.reject(serverError)

      // Failed assembly requests should return a more detailed error in JSON.
      return response.json().then(
        (assembly: AssemblyResponse) => {
          if (!assembly.error) throw serverError

          const error = new AssemblyError(
            assembly.error,
            assembly.message,
            assembly,
          )

          if (assembly.assembly_id) {
            error.details += ` Assembly ID: ${assembly.assembly_id}`
          }
          throw error
        },
        (err) => {
          // eslint-disable-next-line no-param-reassign
          err.cause = serverError
          throw err
        },
      )
    }

    return response.json()
  }

  async createAssembly({
    params,
    fields,
    signature,
    expectedFiles,
  }: OptionsWithRestructuredFields & {
    expectedFiles: number
  }): Promise<AssemblyResponse> {
    const data = new FormData()
    data.append(
      'params',
      typeof params === 'string' ? params : JSON.stringify(params),
    )
    if (signature) {
      data.append('signature', signature)
    }

    Object.keys(fields).forEach((key) => {
      data.append(key, String(fields[key]))
    })
    data.append('num_expected_upload_files', String(expectedFiles))

    const url = new URL(ASSEMBLIES_ENDPOINT, `${this.opts.service}`).href
    return this.#fetchJSON(url, {
      method: 'POST',
      headers: this.#headers,
      body: data,
    }).catch((err) => this.#reportError(err, { url, type: 'API_ERROR' }))
  }

  /**
   * Reserve resources for a file in an Assembly. Then addFile can be used later.
   */
  async reserveFile(
    assembly: AssemblyResponse,
    file: UppyFile<M, B>,
  ): Promise<AssemblyResponse> {
    const size = encodeURIComponent(file.size!)
    const url = `${assembly.assembly_ssl_url}/reserve_file?size=${size}`
    return this.#fetchJSON(url, {
      method: 'POST',
      headers: this.#headers,
    }).catch((err) =>
      this.#reportError(err, { assembly, file, url, type: 'API_ERROR' }),
    )
  }

  /**
   * Import a remote file to an Assembly.
   */
  async addFile(
    assembly: AssemblyResponse,
    file: UppyFile<M, B>,
  ): Promise<AssemblyResponse> {
    if (!file.uploadURL) {
      return Promise.reject(new Error('File does not have an `uploadURL`.'))
    }
    const size = encodeURIComponent(file.size!)
    const uploadUrl = encodeURIComponent(file.uploadURL)
    const filename = encodeURIComponent(file.name)
    const fieldname = 'file'

    const qs = `size=${size}&filename=${filename}&fieldname=${fieldname}&s3Url=${uploadUrl}`
    const url = `${assembly.assembly_ssl_url}/add_file?${qs}`
    return this.#fetchJSON(url, {
      method: 'POST',
      headers: this.#headers,
    }).catch((err) =>
      this.#reportError(err, { assembly, file, url, type: 'API_ERROR' }),
    )
  }

  /**
   * Update the number of expected files in an already created assembly.
   */
  async updateNumberOfFilesInAssembly(
    assembly: AssemblyResponse,
    num_expected_upload_files: number,
  ): Promise<AssemblyResponse> {
    const url = new URL(assembly.assembly_ssl_url)
    url.pathname = '/update_assemblies'
    const body = JSON.stringify({
      assembly_updates: [
        {
          assembly_id: assembly.assembly_id,
          num_expected_upload_files,
        },
      ],
    })
    return this.#fetchJSON(url, {
      method: 'POST',
      headers: this.#headers,
      body,
    }).catch((err) => this.#reportError(err, { url, type: 'API_ERROR' }))
  }

  /**
   * Cancel a running Assembly.
   */
  async cancelAssembly(assembly: AssemblyResponse): Promise<AssemblyResponse> {
    const url = assembly.assembly_ssl_url
    return this.#fetchJSON(url, {
      method: 'DELETE',
      headers: this.#headers,
    }).catch((err) => this.#reportError(err, { url, type: 'API_ERROR' }))
  }

  /**
   * Get the current status for an assembly.
   */
  async getAssemblyStatus(url: string): Promise<AssemblyResponse> {
    return this.#fetchJSON(url, { headers: this.#headers }).catch((err) =>
      this.#reportError(err, { url, type: 'STATUS_ERROR' }),
    )
  }

  async submitError(
    err: { message?: string; details?: string },
    {
      endpoint,
      instance,
      assembly,
    }: {
      endpoint?: string | URL
      instance?: string
      assembly?: string
    } = {},
  ): Promise<AssemblyResponse> {
    const message =
      err.details ? `${err.message} (${err.details})` : err.message

    return this.#fetchJSON('https://transloaditstatus.com/client_error', {
      method: 'POST',
      body: JSON.stringify({
        endpoint,
        instance,
        assembly_id: assembly,
        agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        client: this.opts.client,
        error: message,
      }),
    })
  }

  #reportError = (
    err: AssemblyError,
    params: {
      assembly?: AssemblyResponse
      url?: URL | string
      file?: UppyFile<M, B>
      type: string
    },
  ) => {
    if (this.opts.errorReporting === false) {
      throw err
    }

    const opts: {
      type: string
      assembly?: string
      instance?: string
      endpoint?: URL | string
    } = {
      type: params.type,
    }
    if (params.assembly) {
      opts.assembly = params.assembly.assembly_id
      opts.instance = params.assembly.instance
    }
    if (params.url) {
      opts.endpoint = params.url
    }

    this.submitError(err, opts).catch(() => {
      // not much we can do then is there
    })

    throw err
  }
}
