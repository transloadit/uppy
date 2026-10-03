import type {
  ConfirmOptions,
  PromptOptions,
  ProviderDialogState,
} from '../index.js'

export type { ConfirmOptions, PromptOptions }

type DialogStateStore = {
  setPluginState(patch: { dialog?: ProviderDialogState | undefined }): void
}

type Settle = (confirmed: boolean, value?: string) => void

/**
 * Owns the (single) inline dialog of a provider view. `prompt()` / `confirm()`
 * put the dialog in plugin state — the view renders `ProviderDialog` from it —
 * and resolve once the dialog calls `submit()` or `cancel()`. Opening a new
 * dialog cancels the pending one.
 */
export default class ProviderDialogController {
  #store: DialogStateStore

  #settlePending: Settle | null = null

  #revision = 0

  /** Remount the input when replacing a prompt in the same render batch. */
  get revision(): number {
    return this.#revision
  }

  constructor(store: DialogStateStore) {
    this.#store = store
  }

  /** Resolves with the entered string, or `null` when cancelled. */
  prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.#open({ kind: 'prompt', ...options }, (confirmed, value) =>
        resolve(confirmed ? (value ?? '') : null),
      )
    })
  }

  /** Resolves with `true` when confirmed, `false` when cancelled. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.#open({ kind: 'confirm', ...options }, resolve)
    })
  }

  /** Called by the dialog; `value` is the prompt's input. */
  submit = (value?: string): void => this.#settle(true, value)

  cancel = (): void => this.#settle(false)

  #open(dialog: ProviderDialogState, settle: Settle): void {
    this.cancel()
    this.#revision += 1
    this.#settlePending = settle
    this.#store.setPluginState({ dialog })
  }

  #settle(confirmed: boolean, value?: string): void {
    const settle = this.#settlePending
    if (!settle) return
    this.#settlePending = null
    this.#store.setPluginState({ dialog: undefined })
    settle(confirmed, value)
  }
}
