import type { ProviderDialogState } from '../index.js'

type DialogStateStore = {
  getPluginState(): { dialog?: ProviderDialogState | undefined }
  setPluginState(patch: { dialog?: ProviderDialogState | undefined }): void
}

export type PromptOptions = {
  title: string
  label?: string | undefined
  defaultValue?: string | undefined
  confirmLabel?: string | undefined
}

export type ConfirmOptions = {
  title: string
  message?: string | undefined
  confirmLabel?: string | undefined
  danger?: boolean | undefined
}

/**
 * Owns the (single) inline dialog of a provider view. `prompt()` / `confirm()`
 * put the dialog in plugin state — the view renders `ProviderDialog` from it —
 * and resolve once the dialog calls `submit()` or `cancel()`. Opening a new
 * dialog cancels the pending one.
 */
export default class ProviderDialogController {
  #store: DialogStateStore

  #resolve: ((value: string | boolean | null) => void) | null = null

  constructor(store: DialogStateStore) {
    this.#store = store
  }

  /** Resolves with the entered string, or `null` when cancelled. */
  prompt(options: PromptOptions): Promise<string | null> {
    return this.#open({ kind: 'prompt', ...options }) as Promise<string | null>
  }

  /** Resolves with `true` when confirmed, `false` when cancelled. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return this.#open({ kind: 'confirm', ...options }).then(
      (value) => value === true,
    )
  }

  /** Called by the dialog; `value` is the prompt's input. */
  submit = (value?: string): void => {
    if (!this.#resolve) return
    const { dialog } = this.#store.getPluginState()
    this.#settle(dialog?.kind === 'prompt' ? (value ?? '') : true)
  }

  cancel = (): void => {
    if (!this.#resolve) return
    const { dialog } = this.#store.getPluginState()
    this.#settle(dialog?.kind === 'prompt' ? null : false)
  }

  #open(dialog: ProviderDialogState): Promise<string | boolean | null> {
    this.cancel()
    return new Promise((resolve) => {
      this.#resolve = resolve
      this.#store.setPluginState({ dialog })
    })
  }

  #settle(value: string | boolean | null): void {
    const resolve = this.#resolve
    if (!resolve) return
    this.#resolve = null
    this.#store.setPluginState({ dialog: undefined })
    resolve(value)
  }
}
