// List taken from React.HTMLAttributes supported properties:
// https://unpkg.com/@types/react@17.0.22/index.d.js:1821
const reactSupportedHtmlAttr = [
  // React-specific Attributes
  'defaultChecked',
  'defaultValue',
  'suppressContentEditableWarning',
  'suppressHydrationWarning',
  'dangerouslySetInnerHTML',

  // Standard HTML Attributes
  'accessKey',
  'className',
  'contentEditable',
  'contextMenu',
  'dir',
  'draggable',
  'hidden',
  'id',
  'lang',
  'placeholder',
  'slot',
  'spellCheck',
  'style',
  'tabIndex',
  'title',
  'translate',

  // Unknown
  'radioGroup',

  // WAI-ARIA
  'role',

  // RDFa Attributes
  'about',
  'datatype',
  'inlist',
  'prefix',
  'property',
  'resource',
  'typeof',
  'vocab',

  // Non-standard Attributes
  'autoCapitalize',
  'autoCorrect',
  'autoSave',
  'color',
  'itemProp',
  'itemScope',
  'itemType',
  'itemID',
  'itemRef',
  'results',
  'security',
  'unselectable',

  // Living Standard
  'inputMode',
  'is',

  // Clipboard Events
  'onCopy',
  'onCopyCapture',
  'onCut',
  'onCutCapture',
  'onPaste',
  'onPasteCapture',

  // Composition Events
  'onCompositionEnd',
  'onCompositionEndCapture',
  'onCompositionStart',
  'onCompositionStartCapture',
  'onCompositionUpdate',
  'onCompositionUpdateCapture',

  // Focus Events
  'onFocus',
  'onFocusCapture',
  'onBlur',
  'onBlurCapture',

  // Form Events
  'onChange',
  'onChangeCapture',
  'onBeforeInput',
  'onBeforeInputCapture',
  'onInput',
  'onInputCapture',
  'onReset',
  'onResetCapture',
  'onSubmit',
  'onSubmitCapture',
  'onInvalid',
  'onInvalidCapture',

  // Image Events
  'onLoad',
  'onLoadCapture',
  'onError', // also a Media Event
  'onErrorCapture', // also a Media Event

  // Keyboard Events
  'onKeyDown',
  'onKeyDownCapture',
  'onKeyPress',
  'onKeyPressCapture',
  'onKeyUp',
  'onKeyUpCapture',

  // Media Events
  'onAbort',
  'onAbortCapture',
  'onCanPlay',
  'onCanPlayCapture',
  'onCanPlayThrough',
  'onCanPlayThroughCapture',
  'onDurationChange',
  'onDurationChangeCapture',
  'onEmptied',
  'onEmptiedCapture',
  'onEncrypted',
  'onEncryptedCapture',
  'onEnded',
  'onEndedCapture',
  'onLoadedData',
  'onLoadedDataCapture',
  'onLoadedMetadata',
  'onLoadedMetadataCapture',
  'onLoadStart',
  'onLoadStartCapture',
  'onPause',
  'onPauseCapture',
  'onPlay',
  'onPlayCapture',
  'onPlaying',
  'onPlayingCapture',
  'onProgress',
  'onProgressCapture',
  'onRateChange',
  'onRateChangeCapture',
  'onSeeked',
  'onSeekedCapture',
  'onSeeking',
  'onSeekingCapture',
  'onStalled',
  'onStalledCapture',
  'onSuspend',
  'onSuspendCapture',
  'onTimeUpdate',
  'onTimeUpdateCapture',
  'onVolumeChange',
  'onVolumeChangeCapture',
  'onWaiting',
  'onWaitingCapture',

  // MouseEvents
  'onAuxClick',
  'onAuxClickCapture',
  'onClick',
  'onClickCapture',
  'onContextMenu',
  'onContextMenuCapture',
  'onDoubleClick',
  'onDoubleClickCapture',
  'onDrag',
  'onDragCapture',
  'onDragEnd',
  'onDragEndCapture',
  'onDragEnter',
  'onDragEnterCapture',
  'onDragExit',
  'onDragExitCapture',
  'onDragLeave',
  'onDragLeaveCapture',
  'onDragOver',
  'onDragOverCapture',
  'onDragStart',
  'onDragStartCapture',
  'onDrop',
  'onDropCapture',
  'onMouseDown',
  'onMouseDownCapture',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseMoveCapture',
  'onMouseOut',
  'onMouseOutCapture',
  'onMouseOver',
  'onMouseOverCapture',
  'onMouseUp',
  'onMouseUpCapture',

  // Selection Events
  'onSelect',
  'onSelectCapture',

  // Touch Events
  'onTouchCancel',
  'onTouchCancelCapture',
  'onTouchEnd',
  'onTouchEndCapture',
  'onTouchMove',
  'onTouchMoveCapture',
  'onTouchStart',
  'onTouchStartCapture',

  // Pointer Events
  'onPointerDown',
  'onPointerDownCapture',
  'onPointerMove',
  'onPointerMoveCapture',
  'onPointerUp',
  'onPointerUpCapture',
  'onPointerCancel',
  'onPointerCancelCapture',
  'onPointerEnter',
  'onPointerEnterCapture',
  'onPointerLeave',
  'onPointerLeaveCapture',
  'onPointerOver',
  'onPointerOverCapture',
  'onPointerOut',
  'onPointerOutCapture',
  'onGotPointerCapture',
  'onGotPointerCaptureCapture',
  'onLostPointerCapture',
  'onLostPointerCaptureCapture',

  // UI Events
  'onScroll',
  'onScrollCapture',

  // Wheel Events
  'onWheel',
  'onWheelCapture',

  // Animation Events
  'onAnimationStart',
  'onAnimationStartCapture',
  'onAnimationEnd',
  'onAnimationEndCapture',
  'onAnimationIteration',
  'onAnimationIterationCapture',

  // Transition Events
  'onTransitionEnd',
  'onTransitionEndCapture',
]

const validHTMLAttribute = /^(aria-|data-)/

const getHTMLProps = (
  props: Record<string, unknown>,
): Record<string, unknown> => {
  // Gets all the React props
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key]) =>
        validHTMLAttribute.test(key) || reactSupportedHtmlAttr.includes(key),
    ),
  )
}

export default getHTMLProps
