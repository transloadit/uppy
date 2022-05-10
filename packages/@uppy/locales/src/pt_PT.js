const pt_PT = {
  pluralize (n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

pt_PT.strings = {
  addMore: 'Adicionar mais',
  addMoreFiles: 'Adicionar mais ficheiros',
  addingMoreFiles: 'A adicionar mais ficheiros',
  allowAccessDescription:
    'Para poder tirar fotos e gravar vídeos com a sua câmera, por favor permita que este site a acesse.',
  allowAccessTitle: 'Por favor permita o acesso à sua câmera',
  authenticateWith: 'Ligar a %{pluginName}',
  authenticateWithTitle:
    'Por favor ligue-se a %{pluginName} para selecionar ficheiros',
  back: 'Voltar',
  browse: 'procure',
  browseFiles: 'procure',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar envio de ficheiros',
  chooseFiles: 'Selecionar ficheiros',
  closeModal: 'Fechar Modal',
  companionError: 'Falha na conexão com serviço',
  complete: 'Concluído',
  connectedToInternet: 'Ligado à internet',
  copyLink: 'Copiar link',
  copyLinkToClipboardFallback: 'Copiar URL abaixo',
  copyLinkToClipboardSuccess: 'Link copiado para a área de transferência',
  creatingAssembly: 'A preparar o envio de ficheiros...',
  creatingAssemblyFailed: 'Transloadit: Não foi possível criar o Assembly',
  dashboardTitle: 'Envio de ficheiros',
  dashboardWindowTitle:
    'Janela para envio de ficheiros (Pressione esc para fechar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  done: 'Concluir',
  dropHereOr: 'Arraste ficheiros ou %{browse}',
  dropHint: 'Pode simplesmente arrastar os seus ficheiros para aqui',
  dropPasteBoth: 'Arraste ficheiros, cole ou %{browse}',
  dropPasteFiles: 'Arraste ficheiros, cole ou %{browse}',
  dropPasteFolders: 'Arraste ficheiros, cole ou %{browse}',
  dropPasteImportBoth: 'Arraste ficheiros, cole, %{browse} ou importe de',
  dropPasteImportFiles: 'Arraste ficheiros, cole, %{browse} ou importe de',
  dropPasteImportFolders: 'Arraste ficheiros, cole, %{browse} ou importe de',
  editFile: 'Editar ficheiro',
  editing: 'A editar %{file}',
  emptyFolderAdded: 'A pasta está vazia e nenhum ficheiro foi adicionado.',
  encoding: 'A codificar...',
  enterCorrectUrl:
    'URL incorrecto: Por favor garanta que inseriu um link direto para um ficheiro',
  enterUrlToImport: 'Coloque o URL para importar um ficheiro',
  exceedsSize: 'Este ficheiro excedeu o tamanho máximo permitido %{size}',
  failedToFetch:
    'Serviço falhou ao fazer fetch deste URL. Por favor garante que o URL está correto',
  failedToUpload: 'Falha ao enviar %{file}',
  fileSource: 'Origem do ficheiro: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} ficheiro enviado',
    '1': '%{complete} de %{smart_count} ficheiros enviados',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Concluir edição de ficheiro',
  folderAdded: {
    '0': 'Adicionado %{smart_count} ficheiro de %{folder}',
    '1': 'Adicionado %{smart_count} ficheiros de %{folder}',
  },
  import: 'Importar',
  importFrom: 'Importar de %{name}',
  loading: 'A carregar...',
  logOut: 'Sair',
  myDevice: 'O meu dispositivo',
  noFilesFound: 'Não possui ficheiros ou pastas aqui',
  noInternetConnection: 'Sem ligação à internet',
  pause: 'Pausar',
  pauseUpload: 'Pausar envio de ficheiros',
  paused: 'Pausado',
  poweredBy: 'Desenvolvido por %{uppy}',
  processingXFiles: {
    '0': 'A processar %{smart_count} ficheiro',
    '1': 'A processar %{smart_count} ficheiros',
  },
  removeFile: 'Remover ficheiro',
  resetFilter: 'Limpar filtro',
  resume: 'Retomar',
  resumeUpload: 'Retomar envio de ficheiros',
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
  timedOut: 'Envio de ficheiros parado há %{seconds} segundos, a abortar.',
  upload: 'Enviar ficheiros',
  uploadComplete: 'Envio de ficheiros finalizado',
  uploadFailed: 'Envio de ficheiros falhou',
  uploadPaused: 'Envio de ficheiros pausado',
  uploadXFiles: {
    '0': 'Enviar %{smart_count} ficheiro',
    '1': 'Enviar %{smart_count} ficheiros',
  },
  uploadXNewFiles: {
    '0': 'Enviar +%{smart_count} ficheiro',
    '1': 'Enviar +%{smart_count} ficheiros',
  },
  uploading: 'A enviar',
  uploadingXFiles: {
    '0': 'A enviar %{smart_count} ficheiro',
    '1': 'A enviar %{smart_count} ficheiros',
  },
  xFilesSelected: {
    '0': '%{smart_count} ficheiro selecionado',
    '1': '%{smart_count} ficheiros selecionados',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} ficheiro adicionados',
    '1': '%{smart_count} ficheiros adicionados',
  },
  xTimeLeft: '%{time} restantes',
  youCanOnlyUploadFileTypes: 'Só pode enviar ficheiros: %{types}',
  youCanOnlyUploadX: {
    '0': 'Só pode enviar %{smart_count} ficheiro',
    '1': 'Só pode enviar %{smart_count} ficheiros',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Precisa de selecionar pelo menos %{smart_count} ficheiro',
    '1': 'Precisa de selecionar pelo menos %{smart_count} ficheiros',
  },
  selectFileNamed: 'Selecione o ficheiro %{name}',
  unselectFileNamed: 'Deselecionar ficheiro %{name}',
  openFolderNamed: 'Pasta aberta %{name}',
}

if (typeof Uppy !== 'undefined') {
  globalThis.Uppy.locales.pt_PT = pt_PT
}

export default pt_PT
