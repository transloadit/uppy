import type {
  Body,
  Meta,
  MinimalRequiredUppyFile,
  UIPluginOptions,
} from '@uppy/core'
import Uppy, { UIPlugin } from '@uppy/core'
import { SearchInput } from '@uppy/provider-views'
import type { AssemblyOptions, AssemblyResult } from '@uppy/transloadit'
import Transloadit from '@uppy/transloadit'
import classNames from 'classnames'
import locale from './locale.js'

export interface ImageGeneratorOptions extends UIPluginOptions {
  assemblyOptions: (prompt: string) => Promise<AssemblyOptions>
}

interface PluginState extends Record<string, unknown> {
  prompt: string
  results: AssemblyResult[]
  checkedResultIds: Set<AssemblyResult['id']>
  loading: boolean
}

const defaultState = {
  prompt: '',
  results: [],
  checkedResultIds: new Set(),
  loading: false,
} satisfies PluginState

export default class ImageGenerator<
  M extends Meta,
  B extends Body,
> extends UIPlugin<ImageGeneratorOptions, M, B, PluginState> {
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
    this.unmount()
  }

  search = async () => {
    const assemblyOptions = await this.opts.assemblyOptions(
      this.getPluginState().prompt,
    )
    const localUppy = new Uppy<M, B>().use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions,
    })

    localUppy.on('transloadit:result', (_, result) => {
      const { results } = this.getPluginState()
      // For some reason this event can be called twice with the same result
      // so we check if we already have it before adding it to state.
      if (!results.some((r) => r.id === result.id)) {
        this.setPluginState({ results: [...results, result] })
      }
    })

    try {
      this.setPluginState({
        loading: true,
        results: [],
        checkedResultIds: new Set(),
      })
      await localUppy.upload()
    } finally {
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
    const { prompt, results, checkedResultIds, loading } = this.getPluginState()
    const { i18n } = this.uppy

    if (!results || results.length === 0) {
      return (
        <SearchInput
          searchString={prompt}
          setSearchString={(prompt) => this.setPluginState({ prompt })}
          submitSearchString={this.search}
          inputLabel={i18n('generateImagePlaceholder')}
          buttonLabel={i18n('generate')}
          wrapperClassName="uppy-SearchProvider"
          inputClassName="uppy-c-textInput uppy-SearchProvider-input"
          showButton
          buttonCSSClassName="uppy-SearchProvider-searchButton"
        />
      )
    }

    return (
      <div
        className={classNames(
          'uppy-ProviderBrowser',
          'uppy-ProviderBrowser-viewType--grid',
        )}
      >
        <SearchInput
          searchString={prompt}
          setSearchString={(prompt) => this.setPluginState({ prompt })}
          submitSearchString={this.search}
          inputLabel={i18n('search')}
          clearSearchLabel={i18n('resetSearch')}
          wrapperClassName="uppy-ProviderBrowser-searchFilter"
          inputClassName="uppy-ProviderBrowser-searchFilterInput"
          loading={loading}
        />

        {loading ? (
          <div className="uppy-Provider-loading">{i18n('loading')}</div>
        ) : results.length > 0 ? (
          <div className="uppy-ProviderBrowser-body">
            <ul className="uppy-ProviderBrowser-list" tabIndex={-1}>
              {results.map((result) => (
                <li
                  key={result.id}
                  className={classNames('uppy-ProviderBrowserItem', {
                    'uppy-ProviderBrowserItem--is-checked':
                      checkedResultIds.has(result.id),
                  })}
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
