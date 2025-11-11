import type {
  Body,
  Meta,
  MinimalRequiredUppyFile,
  UIPluginOptions,
  UppyEventMap,
} from '@uppy/core'
import Uppy, { UIPlugin } from '@uppy/core'
import { FilterInput, SearchView } from '@uppy/provider-views'
import type { AssemblyOptions, AssemblyResult } from '@uppy/transloadit'
import Transloadit from '@uppy/transloadit'
import locale from './locale.js'

export interface ImageGeneratorOptions extends UIPluginOptions {
  assemblyOptions: (prompt: string) => Promise<AssemblyOptions>
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

  constructor(uppy: Uppy<M, B>, opts: ImageGeneratorOptions) {
    super(uppy, opts)

    this.id = this.opts.id || 'ImageGenerator'
    this.title = 'Image Generator'
    this.type = 'acquirer'

    this.defaultLocale = locale

    this.setPluginState(defaultState)

    this.i18nInit()
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall(): void {
    this.clearLoadingInterval()
    this.unmount()
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

  search = async () => {
    const assemblyOptions = await this.opts.assemblyOptions(
      this.getPluginState().prompt,
    )
    const localUppy = new Uppy<M, B>().use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions,
    })
    const onResult: UppyEventMap<M, B>['transloadit:result'] = (
      stepName,
      result,
    ) => {
      const { results } = this.getPluginState()
      this.setPluginState({ results: [...results, result], firstRun: false })
    }
    localUppy.on('transloadit:result', onResult)

    // @ts-expect-error not typed because we do not depend on @uppy/dashboard
    this.uppy.once('dashboard:close-panel', () => {
      localUppy.cancelAll()
      localUppy.off('transloadit:result', onResult)
      this.setPluginState(defaultState)
    })

    try {
      this.setPluginState({
        loading: true,
        results: [],
        checkedResultIds: new Set(),
        loadingMessageIndex: 0,
      })
      this.startLoadingAnimation()
      await localUppy.upload()
    } finally {
      this.clearLoadingInterval()
      localUppy.off('transloadit:result', onResult)
      this.setPluginState({ loading: false })
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
          name: `ai-image-${new Date().toISOString()}`,
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
          onSubmit={this.search}
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
          onSubmit={this.search}
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
