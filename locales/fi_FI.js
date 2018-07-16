/* eslint camelcase: 0 */

const fi_FI = {}

fi_FI.strings = {
  chooseFile: 'Valitse tiedosto',
  youHaveChosen: 'Valitsit: %{fileName}',
  orDragDrop: 'tai raahaa se tähän',
  filesChosen: {
    0: '%{smart_count} tiedosto valittu',
    1: '%{smart_count} tiedostoa valittu'
  },
  filesUploaded: {
    0: '%{smart_count} tiedosto siirretty',
    1: '%{smart_count} tiedostoa siirretty'
  },
  files: {
    0: '%{smart_count} tiedosto',
    1: '%{smart_count} tiedostoa'
  },
  uploadFiles: {
    0: 'Siirrä %{smart_count} tiedosto',
    1: 'Siirrä %{smart_count} tiedostoa'
  },
  selectToUpload: 'Valitse siirrettävät tiedostot',
  closeModal: 'Sulje ikkuna',
  upload: 'Siirrä',
  importFrom: 'Tuo tiedostoja',
  dashboardWindowTitle: 'Uppy-ohjausnäkymä (Sulje Esc-näppäimellä)',
  dashboardTitle: 'Uppy-ohjausnäkymä',
  copyLinkToClipboardSuccess: 'Linkki kopioitu leikepöydälle.',
  copyLinkToClipboardFallback: 'Kopioi allaoleva linkki',
  done: 'Valmis',
  localDisk: 'Paikallinen levy',
  dropPasteImport: 'Pudota tiedosto(t) tähän, liitä, tuo tiedostoja ylläolevista sijainneista tai',
  dropPaste: 'Pudota tiedosto(t) tähän, liitä tai',
  browse: 'selaa',
  fileProgress: 'Siirron edistyminen: lähetysnopeus ja arvioitu valmistumisaika',
  numberOfSelectedFiles: 'Valittujen tiedostojen lukumäärä',
  uploadAllNewFiles: 'Siirrä kaikki uudet tiedostot'
}

fi_FI.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.fi_FI = fi_FI
}

module.exports = fi_FI
