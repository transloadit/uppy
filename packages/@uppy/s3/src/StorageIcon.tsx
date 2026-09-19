import type { h } from '@uppy/core/utils/preact'

/** The bucket glyph both storage plugins show as their Dashboard tab icon. */
export default function StorageIcon({
  className,
  color = 'currentcolor',
}: {
  className?: string
  color?: string
}): h.JSX.Element {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <g fill="none" fill-rule="evenodd">
        <ellipse cx="16" cy="9" rx="9" ry="3.5" fill={color} />
        <path
          d="M7 9v14c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V9"
          stroke={color}
          stroke-width="2"
        />
        <path
          d="M7 16c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5"
          stroke={color}
          stroke-width="2"
        />
      </g>
    </svg>
  )
}
