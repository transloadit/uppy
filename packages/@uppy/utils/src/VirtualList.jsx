/**
 * Adapted from preact-virtual-list: https://github.com/developit/preact-virtual-list
 *
 * © 2016 Jason Miller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Adaptations:
 * - Added role=presentation to helper elements
 * - Tweaked styles for Uppy's Dashboard use case
 */

import { Component, h } from 'preact'

const STYLE_INNER = {
  position: 'relative',
  // Disabled for our use case: the wrapper elements around FileList already deal with overflow,
  // and this additional property would hide things that we want to show.
  //
  // overflow: 'hidden',
  width: '100%',
  minHeight: '100%',
}

const STYLE_CONTENT = {
  position: 'absolute',
  top: 0,
  left: 0,
  // Because the `top` value gets set to some offset, this `height` being 100% would make the scrollbar
  // stretch far beyond the content. For our use case, the content div actually can get its height from
  // the elements inside it, so we don't need to specify a `height` property at all.
  //
  // height: '100%',
  width: '100%',
  overflow: 'visible',
}

class VirtualList extends Component {
  constructor(props) {
    super(props)

    // The currently focused node, used to retain focus when the visible rows change.
    // To avoid update loops, this should not cause state updates, so it's kept as a plain property.
    this.focusElement = null

    this.state = {
      offset: 0,
      height: 0,
    }
  }

  componentDidMount() {
    this.resize()
    window.addEventListener('resize', this.handleResize)
  }

  // TODO: refactor to stable lifecycle method
  componentWillUpdate() {
    if (this.base.contains(document.activeElement)) {
      this.focusElement = document.activeElement
    }
  }

  componentDidUpdate() {
    // Maintain focus when rows are added and removed.
    if (
      this.focusElement?.parentNode &&
      document.activeElement !== this.focusElement
    ) {
      this.focusElement.focus()
    }
    this.focusElement = null
    this.resize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  handleScroll = () => {
    this.setState({ offset: this.base.scrollTop })
  }

  handleResize = () => {
    this.resize()
  }

  resize() {
    const { height } = this.state

    if (height !== this.base.offsetHeight) {
      this.setState({
        height: this.base.offsetHeight,
      })
    }
  }

  render({ data, rowHeight, renderRow, overscanCount = 10, ...props }) {
    const { offset, height } = this.state
    // first visible row index
    let start = Math.floor(offset / rowHeight)

    // actual number of visible rows (without overscan)
    let visibleRowCount = Math.floor(height / rowHeight)

    // Overscan: render blocks of rows modulo an overscan row count
    // This dramatically reduces DOM writes during scrolling
    if (overscanCount) {
      start = Math.max(0, start - (start % overscanCount))
      visibleRowCount += overscanCount
    }

    // last visible + overscan row index + padding to allow keyboard focus to travel past the visible area
    const end = start + visibleRowCount + 4

    // data slice currently in viewport plus overscan items
    const selection = data.slice(start, end)

    const styleInner = { ...STYLE_INNER, height: data.length * rowHeight }
    const styleContent = { ...STYLE_CONTENT, top: start * rowHeight }

    // The `role="presentation"` attributes ensure that these wrapper elements are not treated as list
    // items by accessibility and outline tools.
    return (
      <div onScroll={this.handleScroll} {...props}>
        <div role="presentation" style={styleInner}>
          <div role="presentation" style={styleContent}>
            {selection.map(renderRow)}
          </div>
        </div>
      </div>
    )
  }
}

export default VirtualList
