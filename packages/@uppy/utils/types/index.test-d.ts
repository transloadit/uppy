// Can't get this to work correctly with `tsd` right now 🙃
/*
import Translator = require('@uppy/utils/lib/Translator')

const emptyLocale = {
  strings: {},
  pluralize (n: number) { return n === 1 ? 0 : 1 }
}

const overrideLocale = {
  strings: {
    key: 'value'
  }
}

{
  new Translator(emptyLocale)
}

{
  new Translator([emptyLocale, overrideLocale])
}
*/
