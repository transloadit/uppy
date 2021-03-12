// ignore drop/paste events if they are not in input or textarea —
// otherwise when Url plugin adds drop/paste listeners to this.el,
// draging UI elements or pasting anything into any field triggers those events —
// Url treats them as URLs that need to be imported

function ignoreEvent (ev) {
  const tagName = ev.target.tagName
  if (tagName === 'INPUT' ||
      tagName === 'TEXTAREA') {
    ev.stopPropagation()
    return
  }
  ev.preventDefault()
  ev.stopPropagation()
}

module.exports = ignoreEvent
