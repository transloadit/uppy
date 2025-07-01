import { act, render, renderHook } from '@testing-library/react'
import Uppy from '@uppy/core'
import React from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import useUppyState from './useUppyState.js'

describe('useUppyState', () => {
  it('should return and update value with the correct type', () => {
    const uppy = new Uppy()
    const { result, rerender } = renderHook(() =>
      useUppyState(uppy, (state) => state.totalProgress),
    )
    expectTypeOf(result.current).toEqualTypeOf<number>()
    expect(result.current).toBe(0)
    act(() => uppy.setState({ totalProgress: 50 }))
    rerender()
    expect(result.current).toBe(50)
    rerender()
    expect(result.current).toBe(50)
  })

  it('does not re-render unnecessarily', () => {
    const uppy = new Uppy()
    let renderCount = 0

    const Component = React.memo((props: { uppy: Uppy<any, any> }) => {
      const files = useUppyState(props.uppy, (state) =>
        Object.values(state.files),
      )
      renderCount++
      return <div>{files.length}</div>
    })

    const { rerender } = render(<Component uppy={uppy} />)
    expect(renderCount).toBe(1)
    // Re-render without updating Uppy's state
    rerender(<Component uppy={uppy} />)
    // It should have been memoized
    expect(renderCount).toBe(1)
    act(() => uppy.addFile({ name: 'file', data: new Blob() }))
    expect(renderCount).toBe(2)
  })
})
