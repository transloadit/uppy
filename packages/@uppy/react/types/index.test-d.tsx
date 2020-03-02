import React = require('react')
import Uppy = require('@uppy/core')
import { expectError } from 'tsd'
import * as components from '../'

const uppy = Uppy<Uppy.StrictTypes>()

function TestComponent() {
    return (
        <components.Dashboard
            uppy={uppy}
            closeAfterFinish
            hideCancelButton
        />
    )
}

// inline option should be removed from proptypes because it is always overridden
// by the component
expectError(<components.Dashboard inline />)

{
  const el = (
    <components.DragDrop
      width={200}
      height={200}
      note="Images up to 200×200px"
      uppy={uppy}
      locale={{
        strings: {
          // Text to show on the droppable area.
          // `%{browse}` is replaced with a link that opens the system file selection dialog.
          dropHereOr: "Drop here or %{browse}",
          // Used as the label for the link that opens the system file selection dialog.
          browse: "browse"
        }
      }}
    />
  )
}
