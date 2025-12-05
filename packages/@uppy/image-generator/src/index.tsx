import type { Body, Meta, MinimalRequiredUppyFile, Uppy } from '@uppy/core'
import { UIPlugin, type UIPluginOptions } from '@uppy/core'
import { FilterInput, SearchView } from '@uppy/provider-views'
import {
  Assembly,
  type AssemblyResult,
  Client,
  type OptionsWithRestructuredFields,
} from '@uppy/transloadit'
import { RateLimitedQueue } from '@uppy/utils'
import type { h } from 'preact'
import locale from './locale.js'

export interface ImageGeneratorOptions extends UIPluginOptions {
  // OptionsWithRestructuredFields does not allow string[] for `fields`.
  // in @uppy/transloadit we do accept that but then immediately use a type assertion to this type
  // so that's why we just don't allow string[] from the start here
  assemblyOptions: (prompt: string) => Promise<OptionsWithRestructuredFields>
}

interface PluginState extends Record<string, unknown> {
  prompt: string
  results: AssemblyResult[]
  checkedResultIds: Set<AssemblyResult['id']>
  loading: boolean
  loadingMessageIndex: number
  firstRun: boolean
}

const defaultState = {
  prompt: '',
  results: [],
  checkedResultIds: new Set(),
  loading: false,
  loadingMessageIndex: 0,
  firstRun: true,
} satisfies PluginState

const LOADING_MESSAGES = [
  'generating1',
  'generating2',
  'generating3',
  'generating4',
  'generating5',
] as const

export default class ImageGenerator<
  M extends Meta,
  B extends Body,
> extends UIPlugin<ImageGeneratorOptions, M, B, PluginState> {
  private loadingInterval: ReturnType<typeof setInterval> | null = null
  private rateLimitedQueue: RateLimitedQueue
  private client: Client<M, B>
  private assembly: Assembly | null = null
  icon: () => h.JSX.Element

  constructor(uppy: Uppy<M, B>, opts: ImageGeneratorOptions) {
    super(uppy, opts)

    this.id = this.opts.id || 'ImageGenerator'
    this.title = 'AI image'
    this.type = 'acquirer'

    this.defaultLocale = locale

    this.rateLimitedQueue = new RateLimitedQueue(10)
    this.client = new Client({
      service: 'https://api2.transloadit.com',
      rateLimitedQueue: this.rateLimitedQueue,
      errorReporting: true,
    })

    this.setPluginState(defaultState)

    this.i18nInit()

    this.icon = () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <title>ai-image-generator</title>
        <defs>
          <circle id="uppyImageGeneratorCircle" cx="12" cy="12" r="12" />
        </defs>
        <g fill="none" fillRule="evenodd">
          <mask id="uppyImageGeneratorMask" fill="#fff">
            <use xlinkHref="#uppyImageGeneratorCircle" />
          </mask>
          <use xlinkHref="#uppyImageGeneratorCircle" fill="#004b9d" />
          <path
            fill="#fff"
            d="m21.98 15.453 2.793.254a.295.295 0 0 1 0 .586l-2.794.254a6 6 0 0 0-5.432 5.432l-.254 2.794a.295.295 0 0 1-.586 0l-.254-2.794a6 6 0 0 0-5.432-5.432l-2.794-.254a.295.295 0 0 1 0-.586l2.794-.254a6 6 0 0 0 5.432-5.432l.254-2.794a.295.295 0 0 1 .586 0l.254 2.794a6 6 0 0 0 5.432 5.432"
            mask="url(#uppyImageGeneratorMask)"
          />
          <path
            fill="#fff"
            d="m10.74 7.75 1.434.13a.121.121 0 0 1 0 .24l-1.433.13a2.75 2.75 0 0 0-2.49 2.49l-.13 1.434a.121.121 0 0 1-.242 0l-.13-1.433a2.75 2.75 0 0 0-2.49-2.49l-1.433-.13a.121.121 0 0 1 0-.242l1.433-.13a2.75 2.75 0 0 0 2.49-2.49l.13-1.433a.121.121 0 0 1 .242 0l.13 1.433a2.75 2.75 0 0 0 2.49 2.49"
            mask="url(#uppyImageGeneratorMask)"
          />
        </g>
      </svg>
    )
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.clearLoadingInterval()
    this.closeAssembly(true) // Cancel any in-progress assembly
    this.unmount()
  }

  private closeAssembly(cancel = false): void {
    if (this.assembly) {
      const { status } = this.assembly
      this.assembly.close()
      this.assembly = null

      // Cancel the assembly on the server to stop processing
      if (cancel && status) {
        this.client.cancelAssembly(status).catch(() => {
          // If we can't cancel, there's not much we can do
        })
      }
    }
  }

  private clearLoadingInterval(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval)
      this.loadingInterval = null
    }
  }

  private startLoadingAnimation(): void {
    this.clearLoadingInterval()
    this.loadingInterval = setInterval(() => {
      const { loadingMessageIndex } = this.getPluginState()
      const nextIndex = (loadingMessageIndex + 1) % LOADING_MESSAGES.length
      this.setPluginState({ loadingMessageIndex: nextIndex })
    }, 4000)
  }

  /**
   * Creates a Transloadit assembly to generate AI images.
   *
   * Completion scenarios:
   * - Success: assembly emits 'finished' → resolve() → finally cleans up, keeps results
   * - Error: assembly emits 'error' → reject() → catch reports error, finally cleans up
   * - Dashboard close: onDashboardClose sets cancelled=true, resolve() → finally resets state
   * - Uninstall: closeAssembly(true) called directly, cancels server-side assembly
   */
  generate = async () => {
    const { loading, prompt } = this.getPluginState()
    if (loading || prompt.trim() === '') return

    const { promise, resolve, reject } = Promise.withResolvers<void>()
    let cancelled = false

    const onDashboardClose = () => {
      cancelled = true
      resolve()
    }

    // @ts-expect-error not typed because we do not depend on @uppy/dashboard
    this.uppy.once('dashboard:close-panel', onDashboardClose)

    try {
      this.setPluginState({
        loading: true,
        results: [],
        checkedResultIds: new Set(),
        loadingMessageIndex: 0,
      })
      this.startLoadingAnimation()

      const assemblyOptions = await this.opts.assemblyOptions(
        this.getPluginState().prompt,
      )

      const assemblyResponse = await this.client.createAssembly({
        params: assemblyOptions.params,
        fields: assemblyOptions.fields ?? {},
        signature: assemblyOptions.signature,
        expectedFiles: 0,
      })

      const assembly = new Assembly(assemblyResponse, this.rateLimitedQueue)
      this.assembly = assembly

      assembly.on('result', (stepName: string, result: AssemblyResult) => {
        const { results } = this.getPluginState()
        this.setPluginState({
          results: [...results, result],
          firstRun: false,
        })
      })

      assembly.on('error', reject)
      assembly.on('finished', resolve)
      assembly.connect()

      await promise
    } catch (error) {
      this.client.submitError(error as Error).catch(() => {})
      this.uppy.info('Image could not be generated', 'error')
      throw error
    } finally {
      // @ts-expect-error not typed because we do not depend on @uppy/dashboard
      this.uppy.off('dashboard:close-panel', onDashboardClose)
      this.clearLoadingInterval()
      this.closeAssembly(true)
      this.setPluginState(cancelled ? defaultState : { loading: false })
    }
  }

  private onCheckboxChange = (result: AssemblyResult, event?: Event) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      // Prevent shift-clicking from highlighting file names
      document.getSelection()?.removeAllRanges()
    }

    const { checkedResultIds } = this.getPluginState()

    if (checkedResultIds.has(result.id)) {
      checkedResultIds.delete(result.id)
    } else {
      checkedResultIds.add(result.id)
    }

    this.setPluginState({ checkedResultIds })
  }

  private cancelSelection = () => {
    this.setPluginState({ checkedResultIds: new Set() })
  }

  private donePicking = async () => {
    const { checkedResultIds, results } = this.getPluginState()
    const proms: Promise<MinimalRequiredUppyFile<M, B>>[] = results
      .filter((result) => checkedResultIds.has(result.id))
      .map(async (result) => {
        const res = await fetch(result.ssl_url!)
        const blob = await res.blob()

        return {
          name: `ai-image-${result.id!}`,
          type: result.mime ?? undefined,
          source: 'Transloadit',
          data: blob,
        }
      })
    const files = await Promise.all(proms)

    this.uppy.addFiles(files)
    this.setPluginState(defaultState)
  }

  render() {
    const {
      prompt,
      results,
      checkedResultIds,
      loading,
      loadingMessageIndex,
      firstRun,
    } = this.getPluginState()
    const { i18n } = this.uppy

    const currentLoadingMessage = loading
      ? i18n(LOADING_MESSAGES[loadingMessageIndex])
      : undefined

    if (firstRun) {
      return (
        <SearchView
          value={prompt}
          onChange={(prompt) => this.setPluginState({ prompt })}
          onSubmit={this.generate}
          inputLabel={i18n('generateImagePlaceholder')}
          loading={loading}
        >
          {loading ? (
            <span className="uppy-ImageGenerator-generating">
              {currentLoadingMessage}
            </span>
          ) : (
            i18n('generateImage')
          )}
        </SearchView>
      )
    }

    return (
      <div className="uppy-ProviderBrowser uppy-ProviderBrowser-viewType--grid">
        <FilterInput
          value={prompt}
          onChange={(prompt) => this.setPluginState({ prompt })}
          onSubmit={this.generate}
          inputLabel={i18n('search')}
          i18n={i18n}
        />

        {loading ? (
          <div className="uppy-Provider-loading uppy-ImageGenerator-generating--darker">
            {currentLoadingMessage}
          </div>
        ) : results.length > 0 ? (
          <div className="uppy-ProviderBrowser-body">
            <ul className="uppy-ProviderBrowser-list" tabIndex={-1}>
              {results.map((result) => (
                <li
                  key={result.id}
                  className={`uppy-ProviderBrowserItem ${checkedResultIds.has(result.id) ? 'uppy-ProviderBrowserItem--is-checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="uppy-u-reset uppy-ProviderBrowserItem-checkbox uppy-ProviderBrowserItem-checkbox--grid"
                    onChange={(e) => this.onCheckboxChange(result, e)}
                    name="listitem"
                    id={result.id}
                    checked={checkedResultIds.has(result.id)}
                    data-uppy-super-focusable
                  />
                  <label
                    htmlFor={result.id}
                    aria-label={prompt}
                    className="uppy-u-reset uppy-ProviderBrowserItem-inner"
                  >
                    <img
                      src={result.url!}
                      alt={prompt}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="uppy-Provider-empty">{i18n('noSearchResults')}</div>
        )}

        {checkedResultIds.size > 0 && (
          <div className="uppy-ProviderBrowser-footer">
            <div className="uppy-ProviderBrowser-footer-buttons">
              <button
                className="uppy-u-reset uppy-c-btn uppy-c-btn-primary"
                onClick={this.donePicking}
                type="button"
              >
                {i18n('selectX', {
                  smart_count: checkedResultIds.size,
                })}
              </button>
              <button
                className="uppy-u-reset uppy-c-btn uppy-c-btn-link"
                onClick={this.cancelSelection}
                type="button"
              >
                {i18n('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
