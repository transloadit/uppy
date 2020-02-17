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
