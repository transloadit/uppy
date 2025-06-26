import { h } from 'preact'
import type { UppyContext } from './types.js'

export type ProviderIconProps = {
  provider:
    | 'device'
    | 'camera'
    | 'screen-capture'
    | 'audio'
    | 'dropbox'
    | 'facebook'
    | 'instagram'
    | 'onedrive'
    | 'googlephotos'
    | 'googledrive'
  fill?: string
  ctx?: UppyContext
}

export default function ProviderIcon(props: ProviderIconProps) {
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
    case 'dropbox':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <path
            d="M10.5 7.5L5 10.955l5.5 3.454 5.5-3.454 5.5 3.454 5.5-3.454L21.5 7.5 16 10.955zM10.5 21.319L5 17.864l5.5-3.455 5.5 3.455zM16 17.864l5.5-3.455 5.5 3.455-5.5 3.455zM16 25.925l-5.5-3.455 5.5-3.454 5.5 3.454z"
            fill={props.fill || 'currentcolor'}
            fillRule="nonzero"
          />
        </svg>
      )
    case 'facebook':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <g fill="none" fillRule="evenodd">
            <path
              d="M27 16c0-6.075-4.925-11-11-11S5 9.925 5 16c0 5.49 4.023 10.041 9.281 10.866V19.18h-2.793V16h2.793v-2.423c0-2.757 1.642-4.28 4.155-4.28 1.204 0 2.462.215 2.462.215v2.707h-1.387c-1.366 0-1.792.848-1.792 1.718V16h3.05l-.487 3.18h-2.563v7.686C22.977 26.041 27 21.49 27 16"
              fill="#1777F2"
            />
            <path
              d="M20.282 19.18L20.77 16h-3.051v-2.063c0-.87.426-1.718 1.792-1.718h1.387V9.512s-1.258-.215-2.462-.215c-2.513 0-4.155 1.523-4.155 4.28V16h-2.793v3.18h2.793v7.686a11.082 11.082 0 003.438 0V19.18h2.563"
              fill="#FFFFFE"
            />
          </g>
        </svg>
      )
    case 'instagram':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <defs>
            <path
              d="M16.825 5l.483-.001.799.002c1.168.005 1.598.021 2.407.057 1.17.05 1.97.235 2.67.506.725.28 1.34.655 1.951 1.265.613.61.99 1.223 1.273 1.946.273.7.46 1.498.516 2.67l.025.552.008.205c.029.748.037 1.51.042 3.777l.001.846v.703l-.001.398a50.82 50.82 0 01-.058 2.588c-.05 1.17-.235 1.97-.506 2.67a5.394 5.394 0 01-1.265 1.951c-.61.613-1.222.99-1.946 1.273-.699.273-1.498.46-2.668.516-.243.012-.451.022-.656.03l-.204.007c-.719.026-1.512.034-3.676.038l-.847.001h-1.1a50.279 50.279 0 01-2.587-.059c-1.171-.05-1.971-.235-2.671-.506a5.394 5.394 0 01-1.951-1.265 5.385 5.385 0 01-1.272-1.946c-.274-.699-.46-1.498-.517-2.668a88.15 88.15 0 01-.03-.656l-.007-.205c-.026-.718-.034-1.512-.038-3.674v-2.129c.006-1.168.022-1.597.058-2.406.051-1.171.235-1.971.506-2.672a5.39 5.39 0 011.265-1.95 5.381 5.381 0 011.946-1.272c.699-.274 1.498-.462 2.669-.517l.656-.03.204-.007c.718-.026 1.511-.034 3.674-.038zm.678 1.981h-1.226l-.295.001c-2.307.005-3.016.013-3.777.043l-.21.009-.457.02c-1.072.052-1.654.232-2.042.383-.513.2-.879.44-1.263.825a3.413 3.413 0 00-.82 1.267c-.15.388-.33.97-.375 2.043a48.89 48.89 0 00-.056 2.482v.398 1.565c.006 2.937.018 3.285.073 4.444.05 1.073.231 1.654.382 2.043.2.512.44.878.825 1.263.386.383.753.621 1.267.82.388.15.97.328 2.043.374.207.01.388.017.563.024l.208.007a63.28 63.28 0 002.109.026h1.564c2.938-.006 3.286-.019 4.446-.073 1.071-.051 1.654-.232 2.04-.383.514-.2.88-.44 1.264-.825.384-.386.622-.753.82-1.266.15-.389.328-.971.375-2.044.039-.88.054-1.292.057-2.723v-1.15-.572c-.006-2.936-.019-3.284-.074-4.445-.05-1.071-.23-1.654-.382-2.04-.2-.515-.44-.88-.825-1.264a3.405 3.405 0 00-1.267-.82c-.388-.15-.97-.328-2.042-.375a48.987 48.987 0 00-2.535-.056zm-1.515 3.37a5.65 5.65 0 11.021 11.299 5.65 5.65 0 01-.02-11.3zm.004 1.982a3.667 3.667 0 10.015 7.334 3.667 3.667 0 00-.015-7.334zm5.865-3.536a1.32 1.32 0 11.005 2.64 1.32 1.32 0 01-.005-2.64z"
              id="a"
            />
          </defs>
          <g fill="none" fill-rule="evenodd">
            <mask id="b" fill="#fff">
              <use xlinkHref="#a" />
            </mask>
            <image
              mask="url(#b)"
              x="4"
              y="4"
              width="24"
              height="24"
              xlinkHref="data:image/png;base64,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"
            />
          </g>
        </svg>
      )
    case 'onedrive':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <g fill="none" fillRule="nonzero">
            <path
              d="M13.39 12.888l4.618 2.747 2.752-1.15a4.478 4.478 0 012.073-.352 6.858 6.858 0 00-5.527-5.04 6.895 6.895 0 00-6.876 2.982l.07-.002a5.5 5.5 0 012.89.815z"
              fill="#0364B8"
            />
            <path
              d="M13.39 12.887v.001a5.5 5.5 0 00-2.89-.815l-.07.002a5.502 5.502 0 00-4.822 2.964 5.43 5.43 0 00.38 5.62l4.073-1.702 1.81-.757 4.032-1.685 2.105-.88-4.619-2.748z"
              fill="#0078D4"
            />
            <path
              d="M22.833 14.133a4.479 4.479 0 00-2.073.352l-2.752 1.15.798.475 2.616 1.556 1.141.68 3.902 2.321a4.413 4.413 0 00-.022-4.25 4.471 4.471 0 00-3.61-2.284z"
              fill="#1490DF"
            />
            <path
              d="M22.563 18.346l-1.141-.68-2.616-1.556-.798-.475-2.105.88L11.87 18.2l-1.81.757-4.073 1.702A5.503 5.503 0 0010.5 23h12.031a4.472 4.472 0 003.934-2.333l-3.902-2.321z"
              fill="#28A8EA"
            />
          </g>
        </svg>
      )
    case 'googlephotos':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="-7 -7 73 73"
        >
          <g fill="none" fillRule="evenodd">
            <path d="M-3-3h64v64H-3z" />
            <g fillRule="nonzero">
              <path
                fill="#FBBC04"
                d="M14.8 13.4c8.1 0 14.7 6.6 14.7 14.8v1.3H1.3c-.7 0-1.3-.6-1.3-1.3C0 20 6.6 13.4 14.8 13.4z"
              />
              <path
                fill="#EA4335"
                d="M45.6 14.8c0 8.1-6.6 14.7-14.8 14.7h-1.3V1.3c0-.7.6-1.3 1.3-1.3C39 0 45.6 6.6 45.6 14.8z"
              />
              <path
                fill="#4285F4"
                d="M44.3 45.6c-8.2 0-14.8-6.6-14.8-14.8v-1.3h28.2c.7 0 1.3.6 1.3 1.3 0 8.2-6.6 14.8-14.8 14.8z"
              />
              <path
                fill="#34A853"
                d="M13.4 44.3c0-8.2 6.6-14.8 14.8-14.8h1.3v28.2c0 .7-.6 1.3-1.3 1.3-8.2 0-14.8-6.6-14.8-14.8z"
              />
            </g>
          </g>
        </svg>
      )
    case 'googledrive':
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <g fillRule="nonzero" fill="none">
            <path
              d="M6.663 22.284l.97 1.62c.202.34.492.609.832.804l3.465-5.798H5c0 .378.1.755.302 1.096l1.361 2.278z"
              fill="#0066DA"
            />
            <path
              d="M16 12.09l-3.465-5.798c-.34.195-.63.463-.832.804l-6.4 10.718A2.15 2.15 0 005 18.91h6.93L16 12.09z"
              fill="#00AC47"
            />
            <path
              d="M23.535 24.708c.34-.195.63-.463.832-.804l.403-.67 1.928-3.228c.201-.34.302-.718.302-1.096h-6.93l1.474 2.802 1.991 2.996z"
              fill="#EA4335"
            />
            <path
              d="M16 12.09l3.465-5.798A2.274 2.274 0 0018.331 6h-4.662c-.403 0-.794.11-1.134.292L16 12.09z"
              fill="#00832D"
            />
            <path
              d="M20.07 18.91h-8.14l-3.465 5.798c.34.195.73.292 1.134.292h12.802c.403 0 .794-.11 1.134-.292L20.07 18.91z"
              fill="#2684FC"
            />
            <path
              d="M23.497 12.455l-3.2-5.359a2.252 2.252 0 00-.832-.804L16 12.09l4.07 6.82h6.917c0-.377-.1-.755-.302-1.096l-3.188-5.359z"
              fill="#FFBA00"
            />
          </g>
        </svg>
      )
    default:
      return null
  }
}
