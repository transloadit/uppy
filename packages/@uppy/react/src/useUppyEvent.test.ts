import { act, renderHook } from '@testing-library/react'
import Uppy from '@uppy/core'
import type { Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { useUppyEvent } from './index.js'

describe('useUppyEvent', () => {
  it('should return and update value with the correct type', () => {
    const uppy = new Uppy()
    const callback = vi.fn()
    const { result, rerender } = renderHook(() =>
      useUppyEvent(uppy, 'file-added', callback),
    )
    act(() =>
      uppy.addFile({
        source: 'vitest',
        name: 'foo1.jpg',
        type: 'image/jpeg',
        data: new File(['foo1'], 'foo1.jpg', { type: 'image/jpeg' }),
      }),
    )
    expectTypeOf(result.current).toEqualTypeOf<
      [[file: UppyFile<Meta, Record<string, never>>] | [], () => void]
    >()
    expect(result.current[0][0]!.name).toBe('foo1.jpg')
    rerender()
    expect(result.current[0][0]!.name).toBe('foo1.jpg')
    act(() => result.current[1]())
    expectTypeOf(result.current).toEqualTypeOf<
      [[file: UppyFile<Meta, Record<string, never>>] | [], () => void]
    >()
    expect(result.current[0]).toStrictEqual([])
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
