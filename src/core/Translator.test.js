import Core from '../../src/core/index.js'
import russian from '../../src/locales/ru_RU.js'
import english from '../../src/locales/en_US.js'

describe('core/translator', () => {
  describe('translate', () => {
    it('should translate a string', () => {
      const core = new Core({ locale: russian })
      expect(core.translator.translate('chooseFile')).toEqual('Выберите файл')
    })
  })

  describe('interpolation', () => {
    it('should interpolate a string', () => {
      const core = new Core({ locale: english })
      expect(
        core.translator.translate('youHaveChosen', { fileName: 'img.jpg' })
      ).toEqual('You have chosen: img.jpg')
    })
  })

  describe('pluralization', () => {
    it('should translate a string', () => {
      const core = new Core({ locale: russian })
      expect(
        core.translator.translate('filesChosen', { smart_count: '18' })
      ).toEqual('Выбрано 18 файлов')

      expect(
        core.translator.translate('filesChosen', { smart_count: '1' })
      ).toEqual('Выбран 1 файл')

      expect(
        core.translator.translate('filesChosen', { smart_count: '0' })
      ).toEqual('Выбрано 0 файлов')
    })
  })
})
