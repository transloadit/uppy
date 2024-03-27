import { createElement as h, Component } from 'react'
import type { Body, Meta } from '@uppy/utils/lib/UppyFile'
import type { UIPlugin, Uppy } from '@uppy/core'
import PropTypes from 'prop-types'
import { uppy as uppyPropType } from './propTypes.ts'

interface UppyWrapperProps<M extends Meta, B extends Body> {
  uppy: Uppy<M, B>
  plugin: string
}

class UppyWrapper<M extends Meta, B extends Body> extends Component<
  UppyWrapperProps<M, B>
> {
  static propTypes = {
    uppy: uppyPropType.isRequired,
    plugin: PropTypes.string.isRequired,
  }

  private container: HTMLDivElement

  componentDidMount(): void {
    this.installPlugin()
  }

  componentDidUpdate(prevProps: UppyWrapperProps<M, B>): void {
    const { uppy } = this.props
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps)
      this.installPlugin()
    }
  }

  componentWillUnmount(): void {
    this.uninstallPlugin()
  }

  private refContainer = (container: UppyWrapper<M, B>['container']) => {
    this.container = container
  }

  installPlugin(): void {
    const { plugin, uppy } = this.props
    const pluginObj = uppy.getPlugin(plugin) as UIPlugin<any, M, B>

    pluginObj.mount(this.container, pluginObj)
  }

  uninstallPlugin({ uppy } = this.props): void {
    const { plugin } = this.props
    ;(uppy.getPlugin(plugin) as UIPlugin<any, M, B>).unmount()
  }

  render(): ReturnType<typeof h> {
    return h('div', { className: 'uppy-Container', ref: this.refContainer })
  }
}

export default UppyWrapper
