import * as React from "react"
import Uppy from "@uppy/core"
import { expectType, expectError } from "tsd"
import * as components from "../"

const { useUppy } = components

const uppy = new Uppy()

{
  function TestComponent() {
    return (
      <components.Dashboard uppy={uppy} closeAfterFinish hideCancelButton />
    )
  }
}

{
  expectError(<components.Dashboard target="body"/>)
}

// inline option should be removed from proptypes because it is always overridden
// by the component
{
  expectError(<components.Dashboard inline />)
  expectError(<components.DashboardModal inline />)
}

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
          browse: "browse",
        },
      }}
    />
  )
}

{
  const el = (
    <components.DashboardModal
      target="body"
      uppy={uppy}
      open
      animateOpenClose
      onRequestClose={() => {
        alert("no")
      }}
    />
  )

  // use onRequestClose instead.
  expectError(<components.DashboardModal onRequestCloseModal />)
}

{
  function TestHook() {
    expectType<Uppy>(useUppy(() => uppy))
    expectType<Uppy>(useUppy(() => new Uppy()))
    expectError(useUppy(uppy))
  }
}
