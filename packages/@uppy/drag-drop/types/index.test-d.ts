import Uppy = require("@uppy/core");

import DragDrop = require("../");

{
  const uppy = Uppy<Uppy.StrictTypes>();

  uppy.use(DragDrop, {
    replaceTargetContent: true,
    target: "body",
    inputName: "test",
    allowMultipleFiles: true,
    width: 100,
    height: "100",
    note: "note",
    locale: {
      strings: {
        dropHereOr: "test",
        browse: "test"
      }
    },
    onDragOver: event => event.clientX,
    onDragLeave: event => event.clientY,
    onDrop: event => event
  });
}
