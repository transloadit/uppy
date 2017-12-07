import ReduxPlugin from './Redux'
import Plugin from '../core/Plugin'

describe('uploader/reduxPlugin', () => {
  it('should initialise successfully', () => {
    const actionFunction = () => {}
    const dispatchFunction = () => {}
    const redux = new ReduxPlugin(null, {
      action: actionFunction,
      dispatch: dispatchFunction
    })
    expect(redux instanceof Plugin).toEqual(true)
    expect(redux.opts.action).toBe(actionFunction)
    expect(redux.opts.dispatch).toBe(dispatchFunction)
  })

  it('should throw an error if the action option is not specified', () => {
    const dispatchFunction = () => {}

    expect(() => {
      new ReduxPlugin(null, { dispatch: dispatchFunction }) // eslint-disable-line no-new
    }).toThrow('action option is not defined')
  })

  it('should throw an error if the dispatch option is not specified', () => {
    const actionFunction = () => {}

    expect(() => {
      new ReduxPlugin(null, { action: actionFunction }) // eslint-disable-line no-new
    }).toThrow('dispatch option is not defined')
  })

  describe('install', () => {
    it('should subscribe to uppy events', () => {
      const core = {
        on: jest.fn()
      }

      const redux = new ReduxPlugin(core, {
        action: () => {},
        dispatch: () => {}
      })
      redux.handleStateUpdate = jest.fn()
      redux.install()

      expect(core.on.mock.calls.length).toEqual(1)
      expect(core.on.mock.calls[0]).toEqual([
        'state-update',
        redux.handleStateUpdate
      ])
    })

    it('should call this.handleStateUpdate with the current state on install', () => {
      const core = {
        on: jest.fn()
      }

      const redux = new ReduxPlugin(core, {
        action: () => {},
        dispatch: () => {}
      })
      redux.handleStateUpdate = jest.fn()
      redux.install()

      expect(redux.handleStateUpdate.mock.calls.length).toEqual(1)
      expect(redux.handleStateUpdate.mock.calls[0]).toEqual([
        {},
        core.state,
        core.state
      ])
    })
  })

  describe('uninstall', () => {
    it('should should unsubscribe from uppy events on uninstall', () => {
      const core = {
        off: jest.fn()
      }

      const redux = new ReduxPlugin(core, {
        action: () => {},
        dispatch: () => {}
      })
      redux.uninstall()

      expect(core.off.mock.calls.length).toEqual(1)
      expect(core.off.mock.calls[0]).toEqual([
        'state-update',
        redux.handleStateUpdate
      ])
    })
  })

  describe('handleStateUpdate', () => {
    it('should create a redux action with the new state', () => {
      const core = {}
      const actionMock = jest.fn().mockReturnValue({
        foo: 'bar'
      })
      const dispatchMock = () => {}

      const redux = new ReduxPlugin(core, {
        action: actionMock,
        dispatch: dispatchMock
      })
      const prev = { a: 'b' }
      const state = { a: 'b', c: 'd' }
      const patch = { c: 'd' }
      redux.handleStateUpdate(prev, state, patch)
      expect(actionMock.mock.calls.length).toEqual(1)
      expect(actionMock.mock.calls[0]).toEqual([prev, state, patch])
    })

    it('should dispatch a redux action with the new state', () => {
      const core = {}
      const actionMock = jest.fn().mockReturnValue({
        foo: 'bar'
      })
      const dispatchMock = jest.fn()

      const redux = new ReduxPlugin(core, {
        action: actionMock,
        dispatch: dispatchMock
      })
      const prev = { a: 'b' }
      const state = { a: 'b', c: 'd' }
      const patch = { c: 'd' }
      redux.handleStateUpdate(prev, state, patch)
      expect(dispatchMock.mock.calls.length).toEqual(1)
      expect(dispatchMock.mock.calls[0]).toEqual([{ foo: 'bar' }])
    })
  })
})
