const Translator = require('./Translator')
// TODO use stubs instead
const russian = require('../../../../locales/ru_RU')
const english = require('../../../../locales/en_US')

describe('Translator', () => {
  describe('translate', () => {
    it('should translate a string', () => {
      const translator = new Translator(russian)
      expect(translator.translate('chooseFile')).toEqual('Выберите файл')
    })

    it('should translate a string with non-string elements', () => {
      const translator = new Translator({
        strings: {
          test: 'Hello %{who}!',
          test2: 'Hello %{who}'
        }
      })

      const who = Symbol('who')
      expect(translator.translateArray('test', { who: who })).toEqual(['Hello ', who, '!'])
      // No empty string at the end.
      expect(translator.translateArray('test2', { who: who })).toEqual(['Hello ', who])
    })
  })

  describe('translation strings inheritance / overriding', () => {
    const launguagePackLoadedInCore = english
    const defaultStrings = {
      strings: {
        youHaveChosen: 'You have chosen 123: %{fileName}'
      }
    }
    const userSuppliedStrings = {
      strings: {
        youHaveChosen: 'Beep boop: %{fileName}'
      }
    }

    it('should prioritize language pack strings from Core over default', () => {
      const translator = new Translator([ defaultStrings, launguagePackLoadedInCore ])
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' })
      ).toEqual('You have chosen: img.jpg')
    })

    it('should prioritize user-supplied strings over language pack from Core', () => {
      const translator = new Translator([ defaultStrings, launguagePackLoadedInCore, userSuppliedStrings ])
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' })
      ).toEqual('Beep boop: img.jpg')
    })
  })

  describe('interpolation', () => {
    it('should interpolate a string', () => {
      const translator = new Translator(english)
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' })
      ).toEqual('You have chosen: img.jpg')
    })
  })

  describe('pluralization', () => {
    it('should translate a string', () => {
      const translator = new Translator(russian)
      expect(
        translator.translate('filesChosen', { smart_count: 18 })
      ).toEqual('Выбрано 18 файлов')

      expect(
        translator.translate('filesChosen', { smart_count: 1 })
      ).toEqual('Выбран 1 файл')

      expect(
        translator.translate('filesChosen', { smart_count: 0 })
      ).toEqual('Выбрано 0 файлов')
    })
  })
})
