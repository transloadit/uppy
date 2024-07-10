import { createElement as h, Component } from 'react'
import type React from 'react'
import type { UnknownPlugin, Uppy } from '@uppy/core'
import DashboardPlugin from '@uppy/dashboard'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { DashboardOptions } from '@uppy/dashboard'
import getHTMLProps from './getHTMLProps.ts'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.ts'

type DashboardInlineOptions<M extends Meta, B extends Body> = Omit<
  DashboardOptions<M, B> & { inline: true },
  'inline'
> &
  React.BaseHTMLAttributes<HTMLDivElement>

export interface DashboardProps<M extends Meta, B extends Body>
  extends DashboardInlineOptions<M, B> {
  uppy: Uppy<M, B>
}

/**
 * React Component that renders a Dashboard for an Uppy instance. This component
 * renders the Dashboard inline, so you can put it anywhere you want.
 */

class Dashboard<M extends Meta, B extends Body> extends Component<
  DashboardProps<M, B>
> {
  private container!: HTMLElement

  private plugin!: UnknownPlugin<M, B>

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: Dashboard<M, B>['props']): void {
    // eslint-disable-next-line react/destructuring-assignment
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uppy, ...options } = { ...this.props, target: this.container }
      this.plugin.setOptions(options)
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  installPlugin(): void {
    const { uppy, ...options } = {
      id: 'Dashboard',
      ...this.props,
      inline: true,
      target: this.container,
    }
    uppy.use(DashboardPlugin<M, B>, options)

    this.plugin = uppy.getPlugin(options.id)!
  }

  uninstallPlugin(props = this.props): void {
    const { uppy } = props

    uppy.removePlugin(this.plugin)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return h('div', {
      className: 'uppy-Container',
      ref: (container: HTMLElement): void => {
        this.container = container
      },
      ...getHTMLProps(this.props),
    })
  }
}

export default Dashboard
