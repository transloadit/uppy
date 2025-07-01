import type { Body, Meta, UnknownPlugin, Uppy } from '@uppy/core'
import type { DashboardOptions } from '@uppy/dashboard'
import DashboardPlugin from '@uppy/dashboard'
import type React from 'react'
import { Component, createElement as h } from 'react'
import getHTMLProps from './getHTMLProps.js'
import nonHtmlPropsHaveChanged from './nonHtmlPropsHaveChanged.js'

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
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
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
