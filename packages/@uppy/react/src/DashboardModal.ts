import { createElement as h, Component } from 'react'
import type React from 'react'
import DashboardPlugin, { type DashboardOptions } from '@uppy/dashboard'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { Uppy } from '@uppy/core'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

type DashboardInlineOptions<M extends Meta, B extends Body> = Omit<
  DashboardOptions<M, B> & { inline: false },
  'inline' | 'onRequestCloseModal'
> &
  React.BaseHTMLAttributes<HTMLDivElement>

export interface DashboardModalProps<M extends Meta, B extends Body>
  extends DashboardInlineOptions<M, B> {
  uppy: Uppy<M, B>
  onRequestClose?: () => void
  open?: boolean
}

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

class DashboardModal<M extends Meta, B extends Body> extends Component<
  DashboardModalProps<M, B>
> {
  static defaultProps = {
    open: undefined,
    onRequestClose: undefined,
  }

  private container!: HTMLElement

  private plugin!: DashboardPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: DashboardModal<M, B>['props']): void {
    const { uppy, open, onRequestClose } = this.props
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-shadow
      const { uppy, ...options } = {
        ...this.props,
        inline: false,
        onRequestCloseModal: onRequestClose,
      }
      this.plugin.setOptions(options)
    }
    if (prevProps.open && !open) {
      this.plugin.closeModal()
    } else if (!prevProps.open && open) {
      this.plugin.openModal()
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  installPlugin(): void {
    const {
      target = this.container,
      open,
      onRequestClose,
      uppy,
      ...rest
    } = this.props
    const options = {
      id: 'DashboardModal',
      ...rest,
      inline: false,
      target,
      open,
      onRequestCloseModal: onRequestClose,
    }

    uppy.use(DashboardPlugin<M, B>, options)

    this.plugin = uppy.getPlugin(options.id) as DashboardPlugin<M, B>
    if (open) {
      this.plugin.openModal()
    }
  }

  uninstallPlugin(props = this.props): void {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return h('div', {
      className: 'uppy-Container',
      ref: (container: HTMLElement) => {
        this.container = container
      },
      ...getHTMLProps(this.props),
    })
  }
}

export default DashboardModal
