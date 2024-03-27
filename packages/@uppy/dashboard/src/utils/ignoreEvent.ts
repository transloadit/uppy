// ignore drop/paste events if they are not in input or textarea —
// otherwise when Url plugin adds drop/paste listeners to this.el,
// draging UI elements or pasting anything into any field triggers those events —
// Url treats them as URLs that need to be imported

type $TSFixMe = any

function ignoreEvent(ev: $TSFixMe): void {
  const { tagName } = ev.target
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
    ev.stopPropagation()
    return
  }
  ev.preventDefault()
  ev.stopPropagation()
}

export default ignoreEvent
