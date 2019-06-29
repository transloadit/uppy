const { h } = require('preact')

// https://css-tricks.com/creating-svg-icon-system-react/

function defaultPickerIcon () {
  return <svg aria-hidden="true" focusable="false" width="30" height="30" viewBox="0 0 30 30">
    <path d="M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15zm4.258-12.676v6.846h-8.426v-6.846H5.204l9.82-12.364 9.82 12.364H19.26z" />
  </svg>
}

function iconCopy () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="51" height="51" viewBox="0 0 51 51">
    <path d="M17.21 45.765a5.394 5.394 0 0 1-7.62 0l-4.12-4.122a5.393 5.393 0 0 1 0-7.618l6.774-6.775-2.404-2.404-6.775 6.776c-3.424 3.427-3.424 9 0 12.426l4.12 4.123a8.766 8.766 0 0 0 6.216 2.57c2.25 0 4.5-.858 6.214-2.57l13.55-13.552a8.72 8.72 0 0 0 2.575-6.213 8.73 8.73 0 0 0-2.575-6.213l-4.123-4.12-2.404 2.404 4.123 4.12a5.352 5.352 0 0 1 1.58 3.81c0 1.438-.562 2.79-1.58 3.808l-13.55 13.55z" />
    <path d="M44.256 2.858A8.728 8.728 0 0 0 38.043.283h-.002a8.73 8.73 0 0 0-6.212 2.574l-13.55 13.55a8.725 8.725 0 0 0-2.575 6.214 8.73 8.73 0 0 0 2.574 6.216l4.12 4.12 2.405-2.403-4.12-4.12a5.357 5.357 0 0 1-1.58-3.812c0-1.437.562-2.79 1.58-3.808l13.55-13.55a5.348 5.348 0 0 1 3.81-1.58c1.44 0 2.792.562 3.81 1.58l4.12 4.12c2.1 2.1 2.1 5.518 0 7.617L39.2 23.775l2.404 2.404 6.775-6.777c3.426-3.427 3.426-9 0-12.426l-4.12-4.12z" />
  </svg>
}

function iconResume () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 44 44">
    <polygon class="play" transform="translate(6, 5.5)" points="13 21.6666667 13 11 21 16.3333333" />
  </svg>
}

function iconPause () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25px" height="25px" viewBox="0 0 44 44">
    <g transform="translate(18, 17)" class="pause">
      <rect x="0" y="0" width="2" height="10" rx="0" />
      <rect x="6" y="0" width="2" height="10" rx="0" />
    </g>
  </svg>
}

function localIcon () {
  return <svg aria-hidden="true" focusable="false" fill="#607d8b" width="27" height="25" viewBox="0 0 27 25">
    <path d="M5.586 9.288a.313.313 0 0 0 .282.176h4.84v3.922c0 1.514 1.25 2.24 2.792 2.24 1.54 0 2.79-.726 2.79-2.24V9.464h4.84c.122 0 .23-.068.284-.176a.304.304 0 0 0-.046-.324L13.735.106a.316.316 0 0 0-.472 0l-7.63 8.857a.302.302 0 0 0-.047.325z" />
    <path d="M24.3 5.093c-.218-.76-.54-1.187-1.208-1.187h-4.856l1.018 1.18h3.948l2.043 11.038h-7.193v2.728H9.114v-2.725h-7.36l2.66-11.04h3.33l1.018-1.18H3.907c-.668 0-1.06.46-1.21 1.186L0 16.456v7.062C0 24.338.676 25 1.51 25h23.98c.833 0 1.51-.663 1.51-1.482v-7.062L24.3 5.093z" />
  </svg>
}

function iconRetry () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon retry" width="28" height="31" viewBox="0 0 16 19">
    <path d="M16 11a8 8 0 1 1-8-8v2a6 6 0 1 0 6 6h2z" />
    <path d="M7.9 3H10v2H7.9z" />
    <path d="M8.536.5l3.535 3.536-1.414 1.414L7.12 1.914z" />
    <path d="M10.657 2.621l1.414 1.415L8.536 7.57 7.12 6.157z" />
  </svg>
}

function checkIcon () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon UppyIcon-check" width="13" height="9" viewBox="0 0 13 9">
    <polygon points="5 7.293 1.354 3.647 0.646 4.354 5 8.707 12.354 1.354 11.646 0.647" />
  </svg>
}

function iconAudio () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 25 25">
    <path d="M9.5 18.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V7.25a.5.5 0 0 1 .379-.485l9-2.25A.5.5 0 0 1 18.5 5v11.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V8.67l-8 2v7.97zm8-11v-2l-8 2v2l8-2zM7 19.64c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1zm9-2c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1z" fill="#049BCF" fill-rule="nonzero" />
  </svg>
}

function iconVideo () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 25 25">
    <path d="M16 11.834l4.486-2.691A1 1 0 0 1 22 10v6a1 1 0 0 1-1.514.857L16 14.167V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2.834zM15 9H5v8h10V9zm1 4l5 3v-6l-5 3z" fill="#19AF67" fill-rule="nonzero" />
  </svg>
}

function iconPDF () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 25 25">
    <path d="M9.766 8.295c-.691-1.843-.539-3.401.747-3.726 1.643-.414 2.505.938 2.39 3.299-.039.79-.194 1.662-.537 3.148.324.49.66.967 1.055 1.51.17.231.382.488.629.757 1.866-.128 3.653.114 4.918.655 1.487.635 2.192 1.685 1.614 2.84-.566 1.133-1.839 1.084-3.416.249-1.141-.604-2.457-1.634-3.51-2.707a13.467 13.467 0 0 0-2.238.426c-1.392 4.051-4.534 6.453-5.707 4.572-.986-1.58 1.38-4.206 4.914-5.375.097-.322.185-.656.264-1.001.08-.353.306-1.31.407-1.737-.678-1.059-1.2-2.031-1.53-2.91zm2.098 4.87c-.033.144-.068.287-.104.427l.033-.01-.012.038a14.065 14.065 0 0 1 1.02-.197l-.032-.033.052-.004a7.902 7.902 0 0 1-.208-.271c-.197-.27-.38-.526-.555-.775l-.006.028-.002-.003c-.076.323-.148.632-.186.8zm5.77 2.978c1.143.605 1.832.632 2.054.187.26-.519-.087-1.034-1.113-1.473-.911-.39-2.175-.608-3.55-.608.845.766 1.787 1.459 2.609 1.894zM6.559 18.789c.14.223.693.16 1.425-.413.827-.648 1.61-1.747 2.208-3.206-2.563 1.064-4.102 2.867-3.633 3.62zm5.345-10.97c.088-1.793-.351-2.48-1.146-2.28-.473.119-.564 1.05-.056 2.405.213.566.52 1.188.908 1.859.18-.858.268-1.453.294-1.984z" fill="#E2514A" fill-rule="nonzero" />
  </svg>
}

function iconFile () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 25 25">
    <g fill="#A7AFB7" fill-rule="nonzero">
      <path d="M5.5 22a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5h10.719a.5.5 0 0 1 .367.16l3.281 3.556a.5.5 0 0 1 .133.339V21.5a.5.5 0 0 1-.5.5h-14zm.5-1h13V7.25L16 4H6v17z" />
      <path d="M15 4v3a1 1 0 0 0 1 1h3V7h-3V4h-1z" />
    </g>
  </svg>
}

function iconText () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="25" height="25" viewBox="0 0 25 25">
    <path d="M4.5 7h13a.5.5 0 1 1 0 1h-13a.5.5 0 0 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h10a.5.5 0 1 1 0 1h-10a.5.5 0 1 1 0-1z" fill="#5A5E69" fill-rule="nonzero" />
  </svg>
}

function iconCopyLink () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="14" height="14" viewBox="0 0 14 12">
    <path d="M7.94 7.703a2.613 2.613 0 0 1-.626 2.681l-.852.851a2.597 2.597 0 0 1-1.849.766A2.616 2.616 0 0 1 2.764 7.54l.852-.852a2.596 2.596 0 0 1 2.69-.625L5.267 7.099a1.44 1.44 0 0 0-.833.407l-.852.851a1.458 1.458 0 0 0 1.03 2.486c.39 0 .755-.152 1.03-.426l.852-.852c.231-.231.363-.522.406-.824l1.04-1.038zm4.295-5.937A2.596 2.596 0 0 0 10.387 1c-.698 0-1.355.272-1.849.766l-.852.851a2.614 2.614 0 0 0-.624 2.688l1.036-1.036c.041-.304.173-.6.407-.833l.852-.852c.275-.275.64-.426 1.03-.426a1.458 1.458 0 0 1 1.03 2.486l-.852.851a1.442 1.442 0 0 1-.824.406l-1.04 1.04a2.596 2.596 0 0 0 2.683-.628l.851-.85a2.616 2.616 0 0 0 0-3.697zm-6.88 6.883a.577.577 0 0 0 .82 0l3.474-3.474a.579.579 0 1 0-.819-.82L5.355 7.83a.579.579 0 0 0 0 .819z" />
  </svg>
}

function iconPencil () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="14" height="14" viewBox="0 0 14 14">
    <g fill-rule="evenodd"><path d="M1.5 10.793h2.793A1 1 0 0 0 5 10.5L11.5 4a1 1 0 0 0 0-1.414L9.707.793a1 1 0 0 0-1.414 0l-6.5 6.5A1 1 0 0 0 1.5 8v2.793zm1-1V8L9 1.5l1.793 1.793-6.5 6.5H2.5z" fill-rule="nonzero" /><rect x="1" y="12.293" width="11" height="1" rx=".5" /><path fill-rule="nonzero" d="M6.793 2.5L9.5 5.207l.707-.707L7.5 1.793z" /></g>
  </svg>
}

function iconCross () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="18" height="18" viewBox="0 0 18 18">
    <path d="M9 0C4.034 0 0 4.034 0 9s4.034 9 9 9 9-4.034 9-9-4.034-9-9-9z" />
    <path fill="#FFF" d="M13 12.222l-.778.778L9 9.778 5.778 13 5 12.222 8.222 9 5 5.778 5.778 5 9 8.222 12.222 5l.778.778L9.778 9z" />
  </svg>
}

function iconPlus () {
  return <svg aria-hidden="true" focusable="false" class="UppyIcon" width="15" height="15" viewBox="0 0 15 15">
    <path d="M8 6.5h6a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H8v6a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V8h-6a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h6v-6A.5.5 0 0 1 7 0h.5a.5.5 0 0 1 .5.5v6z" />
  </svg>
}

module.exports = {
  defaultPickerIcon,
  iconCopy,
  iconResume,
  iconPause,
  iconRetry,
  localIcon,
  checkIcon,
  iconAudio,
  iconVideo,
  iconPDF,
  iconFile,
  iconText,
  iconCopyLink,
  iconPencil,
  iconCross,
  iconPlus
}
