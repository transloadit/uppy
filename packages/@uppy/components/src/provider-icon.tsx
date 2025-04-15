/* eslint-disable react/destructuring-assignment */
import { h } from 'preact'

export type ProviderIconProps = {
  provider: 'device' | 'camera' | 'screen-capture' | 'audio'
  fill?: string
}

function ProviderIcon(props: ProviderIconProps) {
  switch (props.provider) {
    case 'device':
      return (
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
          <path
            d="M8.45 22.087l-1.305-6.674h17.678l-1.572 6.674H8.45zm4.975-12.412l1.083 1.765a.823.823 0 00.715.386h7.951V13.5H8.587V9.675h4.838zM26.043 13.5h-1.195v-2.598c0-.463-.336-.75-.798-.75h-8.356l-1.082-1.766A.823.823 0 0013.897 8H7.728c-.462 0-.815.256-.815.718V13.5h-.956a.97.97 0 00-.746.37.972.972 0 00-.19.81l1.724 8.565c.095.44.484.755.933.755H24c.44 0 .824-.3.929-.727l2.043-8.568a.972.972 0 00-.176-.825.967.967 0 00-.753-.38z"
            fill-rule="evenodd"
            fill={props.fill || 'currentcolor'}
          />
        </svg>
      )
    case 'camera':
      return (
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
          <path
            d="M23.5 9.5c1.417 0 2.5 1.083 2.5 2.5v9.167c0 1.416-1.083 2.5-2.5 2.5h-15c-1.417 0-2.5-1.084-2.5-2.5V12c0-1.417 1.083-2.5 2.5-2.5h2.917l1.416-2.167C13 7.167 13.25 7 13.5 7h5c.25 0 .5.167.667.333L20.583 9.5H23.5zM16 11.417a4.706 4.706 0 00-4.75 4.75 4.704 4.704 0 004.75 4.75 4.703 4.703 0 004.75-4.75c0-2.663-2.09-4.75-4.75-4.75zm0 7.825c-1.744 0-3.076-1.332-3.076-3.074 0-1.745 1.333-3.077 3.076-3.077 1.744 0 3.074 1.333 3.074 3.076s-1.33 3.075-3.074 3.075z"
            fill-rule="nonzero"
            fill={props.fill || '#02B383'}
          />
        </svg>
      )
    case 'screen-capture':
      return (
        <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32">
          <g fill="currentcolor" fill-rule="evenodd">
            <path d="M24.182 9H7.818C6.81 9 6 9.742 6 10.667v10c0 .916.81 1.666 1.818 1.666h4.546V24h7.272v-1.667h4.546c1 0 1.809-.75 1.809-1.666l.009-10C26 9.742 25.182 9 24.182 9zM24 21H8V11h16v10z" />
            <circle cx="16" cy="16" r="2" />
          </g>
        </svg>
      )
    case 'audio':
      return (
        <svg aria-hidden="true" width="32px" height="32px" viewBox="0 0 32 32">
          <path
            d="M21.143 12.297c.473 0 .857.383.857.857v2.572c0 3.016-2.24 5.513-5.143 5.931v2.64h2.572a.857.857 0 110 1.714H12.57a.857.857 0 110-1.714h2.572v-2.64C12.24 21.24 10 18.742 10 15.726v-2.572a.857.857 0 111.714 0v2.572A4.29 4.29 0 0016 20.01a4.29 4.29 0 004.286-4.285v-2.572c0-.474.384-.857.857-.857zM16 6.5a3 3 0 013 3v6a3 3 0 01-6 0v-6a3 3 0 013-3z"
            fill="currentcolor"
            fill-rule="nonzero"
          />
        </svg>
      )
    default:
      return null
  }
}

export default ProviderIcon
