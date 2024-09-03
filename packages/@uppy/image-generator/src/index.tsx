import { h } from 'preact'
import { UIPlugin, type UIPluginOptions, type Uppy } from '@uppy/core'
import { SearchInput } from '@uppy/provider-views'
import type { Meta, Body } from '@uppy/utils/lib/UppyFile'
// eslint-disable-next-line import/no-extraneous-dependencies
import type Transloadit from '@uppy/transloadit'
import { type AssemblyResult } from '@uppy/transloadit'
import locale from './locale.ts'

export interface ImageGeneratorOptions extends UIPluginOptions {}

interface PluginState extends Record<string, unknown> {
  prompt: string
  results: AssemblyResult[]
  checkedResultIds: Set<AssemblyResult['id']>
}

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

    this.setPluginState({
      prompt: '',
      results: [],
      checkedResultIds: new Set(),
    })

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

    transloadit.setFields({ prompt: this.getPluginState().prompt })

    this.uppy.on('transloadit:result', (stepName, result) => {
      // TODO: this needs to be deterministic
      // stepName is set by the implementer of the template
      if (stepName === 'resized') {
        const { results } = this.getPluginState()
        this.setPluginState({ results: [...results, result] })
      }
    })

    try {
      await this.uppy.upload()
    } catch (err) {
      // TODO: inform the user
    } finally {
      // Normally uppy.upload() is only used to upload your files
      // but here we need it to _get_ the results from the AI image generator Robot.
      // That means users who set `allowMultipleUploadBatches: false` will not
      // be able to actually upload their files, so we reset the state here.
      this.uppy.setState({ allowNewUpload: true })
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

  private donePicking = () => {
    const { checkedResultIds, results } = this.getPluginState()
    const files = results
      .filter((result) => checkedResultIds.has(result.id))
      .map((result) => ({
        name: result.name,
        type: result.mime,
        isRemote: true,
        source: 'Transloadit',
        preview: result.url,
        data: { size: result.size },
      }))

    this.uppy.addFiles(files)
  }

  render() {
    const { prompt, results, checkedResultIds } = this.getPluginState()
    const { i18n } = this.uppy

    if (results.length > 0) {
      return (
        <div className="uppy-ImageGenerator-root">
          <ul className="uppy-ImageGenerator-grid">
            {results.map((result) => (
              <li>
                <input
                  type="checkbox"
                  onChange={() => this.onCheckboxChange(result)}
                  name="image-generator-results"
                  id={result.id}
                  checked={checkedResultIds.has(result.id)}
                  data-uppy-super-focusable
                />
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor={result.id} className="uppy-u-reset">
                  <img src={result.url} alt={prompt} />
                </label>
              </li>
            ))}
          </ul>

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

    return (
      <SearchInput
        searchString={prompt || ''}
        setSearchString={(str) => this.setPluginState({ prompt: str })}
        submitSearchString={this.search}
        inputLabel={i18n('generateImagePlaceholder')}
        buttonLabel={i18n('generateImage')}
        wrapperClassName="uppy-SearchProvider"
        inputClassName="uppy-c-textInput uppy-SearchProvider-input"
        showButton
        buttonCSSClassName="uppy-SearchProvider-searchButton"
      />
    )
  }
}
