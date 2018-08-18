const Assembly = require('./Assembly')

describe('Transloadit/Assembly', () => {
  describe('status diffing', () => {
    function attemptDiff (prev, next) {
      const assembly = new Assembly(prev)
      const events = []
      assembly.emit = jest.fn((name, ...args) => {
        events.push([name, ...args])
      })

      assembly.updateStatus(next)

      return events
    }

    it('ASSEMBLY_UPLOADING → ASSEMBLY_EXECUTING', () => {
      const result = attemptDiff({
        ok: 'ASSEMBLY_UPLOADING',
        files: {},
        results: {}
      }, {
        ok: 'ASSEMBLY_EXECUTING',
        files: {},
        results: {}
      })

      expect(result[0]).toEqual(['executing'])
    })

    it('ASSEMBLY_EXECUTING → ASSEMBLY_FINISHED', () => {
      const result = attemptDiff({
        ok: 'ASSEMBLY_EXECUTING',
        files: {},
        results: {}
      }, {
        ok: 'ASSEMBLY_FINISHED',
        files: {},
        results: {}
      })

      expect(result[0]).toEqual(['finished'])
    })

    it('ASSEMBLY_UPLOADING → ASSEMBLY_FINISHED', () => {
      const result = attemptDiff({
        ok: 'ASSEMBLY_UPLOADING',
        files: {},
        results: {}
      }, {
        ok: 'ASSEMBLY_FINISHED',
        files: {},
        results: {}
      })

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['metadata'])
      expect(result[2]).toEqual(['finished'])
    })

    it('emits events for new files', () => {
      const result = attemptDiff({
        ok: 'ASSEMBLY_UPLOADING',
        files: {},
        results: {}
      }, {
        ok: 'ASSEMBLY_UPLOADING',
        files: {
          some_id: { id: 'some_id' }
        },
        results: {}
      })

      expect(result[0]).toEqual(['upload', { id: 'some_id' }])
    })

    it('emits executing, then upload, on new files + status change', () => {
      const result = attemptDiff({
        ok: 'ASSEMBLY_UPLOADING',
        files: {},
        results: {}
      }, {
        ok: 'ASSEMBLY_EXECUTING',
        files: {
          some_id: { id: 'some_id' }
        },
        results: {}
      })

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['upload', { id: 'some_id' }])
      expect(result[2]).toEqual(['metadata'])
    })

    it('emits new results', () => {
      const one = {
        ok: 'ASSEMBLY_EXECUTING',
        files: {
          cool_video: { id: 'cool_video' }
        },
        results: {}
      }
      const two = {
        ok: 'ASSEMBLY_EXECUTING',
        files: {
          cool_video: { id: 'cool_video' }
        },
        results: {
          step_one: [
            { id: 'thumb1' },
            { id: 'thumb2' },
            { id: 'thumb3' }
          ]
        }
      }
      const three = {
        ok: 'ASSEMBLY_EXECUTING',
        files: {
          cool_video: { id: 'cool_video' }
        },
        results: {
          step_one: [
            { id: 'thumb1' },
            { id: 'thumb2' },
            { id: 'thumb3' },
            { id: 'thumb4' }
          ],
          step_two: [
            { id: 'transcript' }
          ]
        }
      }

      const resultOne = attemptDiff(one, two)
      const resultTwo = attemptDiff(two, three)

      expect(resultOne[0]).toEqual(['result', 'step_one', { id: 'thumb1' }])
      expect(resultOne[1]).toEqual(['result', 'step_one', { id: 'thumb2' }])
      expect(resultOne[2]).toEqual(['result', 'step_one', { id: 'thumb3' }])

      expect(resultTwo[0]).toEqual(['result', 'step_one', { id: 'thumb4' }])
      expect(resultTwo[1]).toEqual(['result', 'step_two', { id: 'transcript' }])
    })

    it('emits correctly jumping straight from uploading to finished', () => {
      const start = {
        ok: 'ASSEMBLY_UPLOADING',
        files: {},
        results: {}
      }
      const end = {
        ok: 'ASSEMBLY_FINISHED',
        files: {
          cool_video: { id: 'cool_video' }
        },
        results: {
          step_one: [
            { id: 'thumb1' },
            { id: 'thumb2' },
            { id: 'thumb3' },
            { id: 'thumb4' }
          ],
          step_two: [
            { id: 'transcript' }
          ]
        }
      }

      const result = attemptDiff(start, end)

      expect(result[0]).toEqual(['executing'])
      expect(result[1]).toEqual(['upload', { id: 'cool_video' }])
      expect(result[2]).toEqual(['metadata'])
      expect(result[3]).toEqual(['result', 'step_one', { id: 'thumb1' }])
      expect(result[4]).toEqual(['result', 'step_one', { id: 'thumb2' }])
      expect(result[5]).toEqual(['result', 'step_one', { id: 'thumb3' }])
      expect(result[6]).toEqual(['result', 'step_one', { id: 'thumb4' }])
      expect(result[7]).toEqual(['result', 'step_two', { id: 'transcript' }])
      expect(result[8]).toEqual(['finished'])
    })
  })
})
