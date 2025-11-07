import type {
  Body,
  Meta,
  MinimalRequiredUppyFile,
  UIPluginOptions,
} from '@uppy/core'
import Uppy, { UIPlugin } from '@uppy/core'
import type {
  AssemblyOptions,
  AssemblyResult,
} from '@uppy/transloadit'
import Transloadit from '@uppy/transloadit'
import { EmptyStateIcon } from './icons.js'
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
    const transloadit = this.uppy.getPlugin<Transloadit<M, B>>('Transloadit')
    if (!transloadit) {
      throw new Error('ImageGenerator requires the Transloadit plugin')
    }
    const assemblyOptions = await this.opts.assemblyOptions(this.getPluginState().prompt)
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

  private onCheckboxChange = (result: AssemblyResult) => {
    const { checkedResultIds } = this.getPluginState()

    if (checkedResultIds.has(result.id)) {
      checkedResultIds.delete(result.id)
    } else {
      checkedResultIds.add(result.id)
    }

    this.setPluginState({ checkedResultIds })
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

    return (
      <div className="uppy-ImageGenerator-root uppy-reset">
        <div className="uppy-ImageGenerator-prompt">
          <input
            type="text"
            id="uppy-image-generator-prompt"
            className="uppy-c-textInput"
            value={prompt}
            disabled={loading}
            placeholder={i18n('generateImagePlaceholder')}
            data-uppy-super-focusable
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                this.search()
              }
            }}
            onInput={(e) =>
              this.setPluginState({
                prompt: (e.target as HTMLInputElement).value,
              })
            }
          />
          <label for="uppy-image-generator-prompt">Prompt</label>
          <button
            type="button"
            className=""
            onClick={this.search}
            disabled={loading}
            data-uppy-super-focusable
          >
            <span className="">Generate</span>
          </button>
        </div>

        {results.length > 0 ? (
          <ul
            className={`uppy-ImageGenerator-grid ${
              results.length === 1 ? 'uppy-ImageGenerator-grid--single' : ''
            }`}
          >
            {results.map((result) => (
              <li key={result.id}>
                <input
                  type="checkbox"
                  onChange={() => this.onCheckboxChange(result)}
                  name="image-generator-results"
                  id={result.id}
                  checked={checkedResultIds.has(result.id)}
                  data-uppy-super-focusable
                />
                <label htmlFor={result.id} className="uppy-u-reset">
                  <img src={result.url!} alt={prompt} />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="uppy-ImageGenerator-empty-state">
            <div>
              <EmptyStateIcon />
              {loading ? (
                <p className="uppy-ImageGenerator-generating">Generating</p>
              ) : (
                <p>Generate a new image using Transloadit AI</p>
              )}
            </div>
          </div>
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
                onClick={() =>
                  this.setPluginState({ checkedResultIds: new Set() })
                }
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
