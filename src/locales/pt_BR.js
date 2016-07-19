const pt_BR = {}

pt_BR.strings = {
  chooseFile: 'Escolha um arquivo',
  youHaveChosen: 'Você escolheu: %{fileName}',
  orDragDrop: 'ou arraste-o aqui',
  filesChosen: {
    0: '%{smart_count} arquivo selecionado',
    1: '%{smart_count} arquivos selecionados'
  },
  filesUploaded: {
    0: '%{smart_count} arquivo enviado',
    1: '%{smart_count} arquivos enviados'
  },
  files: {
    0: '%{smart_count} arquivo',
    1: '%{smart_count} arquivos'
  },
  uploadFiles: {
    0: 'Upload %{smart_count} arquivo',
    1: 'Upload %{smart_count} arquivos'
  },
  selectToUpload: 'Selecione arquivos para enviar',
  closeModal: 'Fechar Modal',
  upload: 'Enviar'
}

pt_BR.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.pt_BR = pt_BR
}

module.exports = pt_BR
