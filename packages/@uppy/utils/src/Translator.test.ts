import { describe, expect, it } from 'vitest'
import Translator, { type Locale, type LocaleStrings } from './Translator.js'

const english: Locale<0 | 1> = {
  strings: {
    chooseFile: 'Choose a file',
    youHaveChosen: 'You have chosen: %{fileName}',
    filesChosen: {
      0: '%{smart_count} file selected',
      1: '%{smart_count} files selected',
    },
  },
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

const russian = {
  strings: {
    chooseFile: 'Выберите файл',
    youHaveChosen: 'Вы выбрали: %{file_name}',
    filesChosen: {
      0: 'Выбран %{smart_count} файл',
      1: 'Выбрано %{smart_count} файла',
      2: 'Выбрано %{smart_count} файлов',
    },
  },
  pluralize(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) {
      return 0
    }

    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
      return 1
    }

    return 2
  },
}

describe('Translator', () => {
  describe('translate', () => {
    it('should translate a string', () => {
      const translator = new Translator(russian)
      expect(translator.translate('chooseFile')).toEqual('Выберите файл')
    })

    it('should translate a string with non-string elements', () => {
      const translator = new Translator({
        pluralize: english.pluralize,
        strings: {
          test: 'Hello %{who}!',
          test2: 'Hello %{who}',
        },
      })

      const who = Symbol('who') as any as string
      expect(translator.translateArray('test', { who })).toEqual([
        'Hello ',
        who,
        '!',
      ])
      // No empty string at the end.
      expect(translator.translateArray('test2', { who })).toEqual([
        'Hello ',
        who,
      ])
    })
  })

  describe('translation strings inheritance / overriding', () => {
    const launguagePackLoadedInCore = english
    const defaultStrings = {
      pluralize: english.pluralize,
      strings: {
        youHaveChosen: 'You have chosen 123: %{fileName}',
      },
    }
    const userSuppliedStrings = {
      pluralize: english.pluralize,
      strings: {
        youHaveChosen: 'Beep boop: %{fileName}',
      },
    }

    it('should prioritize language pack strings from Core over default', () => {
      const translator = new Translator([
        defaultStrings,
        launguagePackLoadedInCore,
      ])
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' }),
      ).toEqual('You have chosen: img.jpg')
    })

    it('should prioritize user-supplied strings over language pack from Core', () => {
      const translator = new Translator([
        defaultStrings,
        launguagePackLoadedInCore,
        userSuppliedStrings,
      ])
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' }),
      ).toEqual('Beep boop: img.jpg')
    })
  })

  describe('interpolation', () => {
    it('should interpolate a string', () => {
      const translator = new Translator(english)
      expect(
        translator.translate('youHaveChosen', { fileName: 'img.jpg' }),
      ).toEqual('You have chosen: img.jpg')
    })
  })

  describe('pluralization', () => {
    it('should translate a string', () => {
      const translator = new Translator(russian)
      expect(translator.translate('filesChosen', { smart_count: 18 })).toEqual(
        'Выбрано 18 файлов',
      )

      expect(translator.translate('filesChosen', { smart_count: 1 })).toEqual(
        'Выбран 1 файл',
      )

      expect(translator.translate('filesChosen', { smart_count: 0 })).toEqual(
        'Выбрано 0 файлов',
      )
    })

    it('should support strings without plural forms', () => {
      const translator = new Translator({
        strings: {
          theAmount: 'het aantal is %{smart_count}',
        },
        pluralize: () => 0,
      })

      expect(translator.translate('theAmount', { smart_count: 0 })).toEqual(
        'het aantal is 0',
      )
      expect(translator.translate('theAmount', { smart_count: 1 })).toEqual(
        'het aantal is 1',
      )
      expect(
        translator.translate('theAmount', { smart_count: 1202530 }),
      ).toEqual('het aantal is 1202530')
    })

    it('should error when using a plural form without %{smart_count}', () => {
      const translator = new Translator({
        strings: {
          test: {
            0: 'A test',
            1: '%{smart_count} tests',
          },
        },
        pluralize: () => 1,
      })

      expect(() => {
        translator.translate('test')
      }).toThrow(
        'Attempted to use a string with plural forms, but no value was given for %{smart_count}',
      )
    })
  })

  describe('LocaleStrings type intersection issue', () => {
    // Mock Dashboard and StatusBar locale types for testing
    const dashboardLocale = {
      strings: {
        closeModal: 'Close Modal',
        addMoreFiles: 'Add more files',
        dashboardTitle: 'Uppy Dashboard',
      },
      pluralize: (n: number) => (n === 1 ? 0 : 1),
    }

    const statusBarLocale = {
      strings: {
        uploading: 'Uploading',
        complete: 'Complete',
        uploadFailed: 'Upload failed',
        retry: 'Retry',
        cancel: 'Cancel',
      },
      pluralize: (n: number) => (n === 1 ? 0 : 1),
    }

    it('should allow partial locale strings in intersection types', () => {
      // This should work - user wants to override just one key
      type IntersectionLocale = LocaleStrings<typeof dashboardLocale> & typeof statusBarLocale
      
      // This should be valid - user should be able to pass just partial strings
      const partialLocale: IntersectionLocale = {
        strings: {
          closeModal: 'Custom Close Modal', // Only overriding one dashboard string
          // StatusBar strings are required by the intersection
          uploading: 'Uploading',
          complete: 'Complete', 
          uploadFailed: 'Upload failed',
          retry: 'Retry',
          cancel: 'Cancel',
        },
        pluralize: (n: number) => (n === 1 ? 0 : 1),
      }

      // This should also work - minimal override with optional strings
      const minimalLocale: IntersectionLocale = {
        strings: {
          closeModal: 'Custom Close Modal', // Only overriding one dashboard string
          // StatusBar strings are required by the intersection
          uploading: 'Uploading',
          complete: 'Complete',
          uploadFailed: 'Upload failed',
          retry: 'Retry',
          cancel: 'Cancel',
        },
        pluralize: (n: number) => (n === 1 ? 0 : 1),
      }

      expect(partialLocale.strings.closeModal).toBe('Custom Close Modal')
      expect(minimalLocale.strings.closeModal).toBe('Custom Close Modal')
    })

    it('should work with deeply nested intersection types like Dashboard', () => {
      // Simulate the actual Dashboard locale intersection type
      type DashboardLocaleType = LocaleStrings<typeof dashboardLocale> & typeof statusBarLocale
      
      // This should work - user should only need to provide the keys they want to override
      const customLocale: DashboardLocaleType = {
        strings: {
          // Should be able to override just dashboard strings
          closeModal: 'My Custom Close',
          // StatusBar strings are required by the intersection
          uploading: 'Uploading',
          complete: 'Complete',
          uploadFailed: 'Upload failed',
          retry: 'Retry', 
          cancel: 'Cancel',
        },
        pluralize: (n: number) => (n === 1 ? 0 : 1),
      }

      expect(customLocale.strings.closeModal).toBe('My Custom Close')
    })

    it('should handle missing strings gracefully', () => {
      // Test that strings can be completely optional
      type OptionalLocale = LocaleStrings<typeof dashboardLocale>
      
      const emptyLocale: OptionalLocale = {
        // strings is optional, so this should work
      }

      const partialLocale: OptionalLocale = {
        strings: {
          closeModal: 'Only this one',
        },
      }

      expect(emptyLocale.strings).toBeUndefined()
      expect(partialLocale.strings?.closeModal).toBe('Only this one')
    })

    it('should work with Dashboard-style intersection of LocaleStrings types', () => {
      // Simulate the actual fixed Dashboard locale intersection type
      type DashboardLocaleType = LocaleStrings<typeof dashboardLocale> & LocaleStrings<typeof statusBarLocale>
      
      // This should now work - user can provide just partial strings from either locale
      const customLocale: DashboardLocaleType = {
        strings: {
          // Override just one Dashboard string
          closeModal: 'My Custom Close',
          // Override just one StatusBar string
          uploading: 'Custom Uploading',
          // All other strings are optional now
        },
      }

      // This should also work - completely minimal
      const minimalLocale: DashboardLocaleType = {
        strings: {
          closeModal: 'Just This One',
        },
      }

      // This should work - no strings at all
      const emptyLocale: DashboardLocaleType = {
        // strings is completely optional
      }

      expect(customLocale.strings?.closeModal).toBe('My Custom Close')
      expect(customLocale.strings?.uploading).toBe('Custom Uploading')
      expect(minimalLocale.strings?.closeModal).toBe('Just This One')
      expect(emptyLocale.strings).toBeUndefined()
    })
  })
})
