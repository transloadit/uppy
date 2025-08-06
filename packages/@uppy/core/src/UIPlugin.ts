import findDOMElement from '@uppy/utils/lib/findDOMElement'
import getTextDirection from '@uppy/utils/lib/getTextDirection'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import { render } from 'preact/compat'
import type { PluginOpts } from './BasePlugin.js'
import BasePlugin from './BasePlugin.js'
import type { State } from './Uppy.js'

/**
 * Defer a frequent call to the microtask queue.
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let calling: Promise<ReturnType<T>> | null = null
  let latestArgs: Parameters<T>
  return (...args) => {
    latestArgs = args
    if (!calling) {
      calling = Promise.resolve().then(() => {
        calling = null
        // At this point `args` may be different from the most
        // recent state, if multiple calls happened since this task
        // was queued. So we use the `latestArgs`, which definitely
        // is the most recent call.
        return fn(...latestArgs)
      })
    }
    return calling
  }
}

/**
 * UIPlugin is the extended version of BasePlugin to incorporate rendering with Preact.
 * Use this for plugins that need a user interface.
 *
 * For plugins without an user interface, see BasePlugin.
 */
class UIPlugin<
  Opts extends UIPluginOptions,
  M extends Meta,
  B extends Body,
  PluginState extends Record<string, unknown> = Record<string, unknown>,
> extends BasePlugin<Opts, M, B, PluginState> {
  #updateUI!: (state: Partial<State<M, B>>) => void

  isTargetDOMEl!: boolean

  el!: HTMLElement | null

  parent: unknown

  title!: string

  getTargetPlugin<Me extends Meta, Bo extends Body>(
    target: PluginTarget<Me, Bo>,
  ): UIPlugin<any, Me, Bo> | undefined {
    let targetPlugin: any
    if (typeof (target as UIPlugin<any, any, any>)?.addTarget === 'function') {
      // Targeting a plugin *instance*
      targetPlugin = target as UIPlugin<any, any, any>
      if (!(targetPlugin instanceof UIPlugin)) {
        console.warn(
          new Error(
            'The provided plugin is not an instance of UIPlugin. This is an indication of a bug with the way Uppy is bundled.',
            { cause: { targetPlugin, UIPlugin } },
          ),
        )
      }
    } else if (typeof target === 'function') {
      // Targeting a plugin type
      const Target = target
      // Find the target plugin instance.
      this.uppy.iteratePlugins((p) => {
        if (p instanceof Target) {
          targetPlugin = p
        }
      })
    }

    return targetPlugin
  }

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   */
  mount<Me extends Meta, Bo extends Body>(
    target: PluginTarget<Me, Bo>,
    plugin: UIPlugin<any, Me, Bo>,
  ): HTMLElement {
    const callerPluginName = plugin.id

    const targetElement = findDOMElement(target)

    if (targetElement) {
      this.isTargetDOMEl = true
      // When target is <body> with a single <div> element,
      // Preact thinks it’s the Uppy root element in there when doing a diff,
      // and destroys it. So we are creating a fragment (could be empty div)
      const uppyRootElement = document.createElement('div')
      uppyRootElement.classList.add('uppy-Root')

      // API for plugins that require a synchronous rerender.
      this.#updateUI = debounce((state) => {
        // plugin could be removed, but this.rerender is debounced below,
        // so it could still be called even after uppy.removePlugin or uppy.destroy
        // hence the check
        if (!this.uppy.getPlugin(this.id)) return
        render(this.render(state, uppyRootElement), uppyRootElement)
        this.afterUpdate()
      })

      this.uppy.log(
        `Installing ${callerPluginName} to a DOM element '${target}'`,
      )

      if (this.opts.replaceTargetContent) {
        // Doing render(h(null), targetElement), which should have been
        // a better way, since because the component might need to do additional cleanup when it is removed,
        // stopped working — Preact just adds null into target, not replacing
        targetElement.innerHTML = ''
      }

      render(
        this.render(this.uppy.getState(), uppyRootElement),
        uppyRootElement,
      )
      this.el = uppyRootElement
      targetElement.appendChild(uppyRootElement)

      // Set the text direction if the page has not defined one.
      uppyRootElement.dir =
        this.opts.direction || getTextDirection(uppyRootElement) || 'ltr'

      this.onMount()

      return this.el!
    }

    const targetPlugin = this.getTargetPlugin(target)

    if (targetPlugin) {
      this.uppy.log(`Installing ${callerPluginName} to ${targetPlugin.id}`)
      this.parent = targetPlugin
      this.el = targetPlugin.addTarget(plugin)

      this.onMount()
      return this.el!
    }

    this.uppy.log(`Not installing ${callerPluginName}`)

    let message = `Invalid target option given to ${callerPluginName}.`
    if (typeof target === 'function') {
      message +=
        ' The given target is not a Plugin class. ' +
        "Please check that you're not specifying a React Component instead of a plugin. " +
        'If you are using @uppy/* packages directly, make sure you have only 1 version of @uppy/core installed: ' +
        'run `npm ls @uppy/core` on the command line and verify that all the versions match and are deduped correctly.'
    } else {
      message +=
        'If you meant to target an HTML element, please make sure that the element exists. ' +
        'Check that the <script> tag initializing Uppy is right before the closing </body> tag at the end of the page. ' +
        '(see https://github.com/transloadit/uppy/issues/1042)\n\n' +
        'If you meant to target a plugin, please confirm that your `import` statements or `require` calls are correct.'
    }
    throw new Error(message)
  }

  /**
   * Called when plugin is mounted, whether in DOM or into another plugin.
   * Needed because sometimes plugins are mounted separately/after `install`,
   * so this.el and this.parent might not be available in `install`.
   * This is the case with @uppy/react plugins, for example.
   */
  render(state: Record<string, unknown>, container?: HTMLElement): any {
    throw new Error(
      'Extend the render method to add your plugin to a DOM element',
    )
  }

  update(state: Partial<State<M, B>>): void {
    if (this.el != null) {
      this.#updateUI?.(state)
    }
  }

  unmount(): void {
    if (this.isTargetDOMEl) {
      this.el?.remove()
    }
    this.onUnmount()
  }

  onMount(): void {}

  onUnmount(): void {}
}

export default UIPlugin

export type PluginTarget<M extends Meta, B extends Body> =
  | string
  | Element
  | typeof BasePlugin
  | typeof UIPlugin
  | BasePlugin<any, M, B>

export interface UIPluginOptions extends PluginOpts {
  target?: PluginTarget<any, any>
  replaceTargetContent?: boolean
  direction?: 'ltr' | 'rtl'
}
