const pt_BR = {
  pluralize (n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

pt_BR.strings = {
  addMore: 'Adicione mais',
  addMoreFiles: 'Adicionar mais arquivos',
  addingMoreFiles: 'Adicionando mais arquivos',
  allowAccessDescription:
    'Para poder tirar fotos e gravar vídeos com sua câmera, por favor permita o acesso a câmera para esse site.',
  allowAccessTitle: 'Por favor permita o acesso a sua câmera',
  authenticateWith: 'Conectar com %{pluginName}',
  authenticateWithTitle:
    'Por favor conecte com %{pluginName} para selecionar arquivos',
  back: 'Voltar',
  browse: 'navegue',
  browseFiles: 'navegue',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar envio de arquivos',
  chooseFiles: 'Selecionar arquivos',
  closeModal: 'Fechar Modal',
  companionError: 'Conexão com serviço falhou',
  complete: 'Concluído',
  connectedToInternet: 'Conectado á internet',
  copyLink: 'Copiar link',
  copyLinkToClipboardFallback: 'Copiar URL abaixo',
  copyLinkToClipboardSuccess: 'Link copiado para a área de transferência',
  creatingAssembly: 'Preparando envio de arquivos...',
  creatingAssemblyFailed: 'Transloadit: Não foi possível criar o Assembly',
  dashboardTitle: 'Envio de arquivos',
  dashboardWindowTitle:
    'Janela para envio de arquivos (Pressione esc para fechar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  done: 'Concluir',
  dropHereOr: 'Arraste arquivos aqui ou %{browse}',
  dropHint: 'Solte seus arquivos aqui',
  dropPasteBoth: 'Solte arquivos aqui, cole ou %{browse}',
  dropPasteFiles: 'Solte arquivos aqui, cole ou %{browse}',
  dropPasteFolders: 'Solte arquivos aqui, cole ou %{browse}',
  dropPasteImportBoth: 'Solte arquivos aqui, cole, %{browse} ou importe de',
  dropPasteImportFiles: 'Solte arquivos aqui, cole, %{browse} ou importe de',
  dropPasteImportFolders: 'Solte arquivos aqui, cole, %{browse} ou importe de',
  editFile: 'Editar arquivo',
  editing: 'Editando %{file}',
  emptyFolderAdded: 'Nenhum arquivo foi adicionado da pasta vazia',
  encoding: 'Codificando...',
  enterCorrectUrl:
    'URL incorreta: Por favor tenha certeza que inseriu um link direto para um arquivo',
  enterUrlToImport: 'Coloque a URL para importar um arquivo',
  exceedsSize: 'Esse arquivo excedeu o tamanho máximo permitido %{size}',
  failedToFetch:
    'Serviço falhou para buscar essa URL, por favor tenha certeza que a URL está correta',
  failedToUpload: 'Falha para enviar %{file}',
  fileSource: 'Origem do arquivo: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} arquivo enviado',
    '1': '%{complete} de %{smart_count} arquivos enviados',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Finalizar edição de arquivo',
  folderAdded: {
    '0': 'Adicionado %{smart_count} arquivo de %{folder}',
    '1': 'Adicionado %{smart_count} arquivos de %{folder}',
  },
  import: 'Importar',
  importFrom: 'Importar de %{name}',
  loading: 'Carregando...',
  logOut: 'Deslogar',
  myDevice: 'Meu dispositivo',
  noFilesFound: 'Você não possui arquivos ou pastas aqui',
  noInternetConnection: 'Sem conexão com a internet',
  pause: 'Pausar',
  pauseUpload: 'Pausar envio de arquivos',
  paused: 'Pausado',
  poweredBy: 'Desenvolvido por %{uppy}',
  processingXFiles: {
    '0': 'Processando %{smart_count} arquivo',
    '1': 'Processando %{smart_count} arquivos',
  },
  removeFile: 'Remover arquivo',
  resetFilter: 'Resetar filtro',
  resume: 'Retomar',
  resumeUpload: 'Retomar envio de arquivos',
  retry: 'Tentar novamente',
  retryUpload: 'Tentar enviar novamente',
  saveChanges: 'Salvar alterações',
  selectX: {
    '0': 'Selecionar %{smart_count}',
    '1': 'Selecionar %{smart_count}',
  },
  smile: 'Sorria!',
  startRecording: 'Começar gravação de vídeo',
  stopRecording: 'Parar gravação de vídeo',
  takePicture: 'Tirar uma foto',
  timedOut: 'Envio de arquivos parado por %{seconds} segundos, abortando.',
  upload: 'Enviar arquivos',
  uploadComplete: 'Envio de arquivos finalizado',
  uploadFailed: 'Envio de arquivos falhou',
  uploadPaused: 'Envio de arquivos pausado',
  uploadXFiles: {
    '0': 'Enviar %{smart_count} arquivo',
    '1': 'Enviar %{smart_count} arquivos',
  },
  uploadXNewFiles: {
    '0': 'Enviar +%{smart_count} arquivo',
    '1': 'Enviar +%{smart_count} arquivos',
  },
  uploading: 'Enviando',
  uploadingXFiles: {
    '0': 'Enviando %{smart_count} arquivo',
    '1': 'Enviando %{smart_count} arquivos',
  },
  xFilesSelected: {
    '0': '%{smart_count} arquivo selecionado',
    '1': '%{smart_count} arquivos selecionados',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} arquivo adicionados',
    '1': '%{smart_count} arquivos adicionados',
  },
  xTimeLeft: '%{time} restantes',
  youCanOnlyUploadFileTypes: 'Você pode enviar apenas arquivos: %{types}',
  youCanOnlyUploadX: {
    '0': 'Você pode enviar apenas %{smart_count} arquivo',
    '1': 'Você pode enviar apenas %{smart_count} arquivos',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Você precisa selecionar pelo menos %{smart_count} arquivo',
    '1': 'Você precisa selecionar pelo menos %{smart_count} arquivos',
  },
  selectFileNamed: 'Selecione o arquivo %{name}',
  unselectFileNamed: 'Deselecionar arquivo %{name}',
  openFolderNamed: 'Pasta aberta %{name}',
}

if (typeof Uppy !== 'undefined') {
  globalThis.Uppy.locales.pt_BR = pt_BR
}

export default pt_BR
