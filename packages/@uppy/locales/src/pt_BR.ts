import type { Locale } from '@uppy/utils'

const pt_BR: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n === 1) {
      return 0
    }
    return 1
  },
}

pt_BR.strings = {
  addBulkFilesFailed: {
    '0': 'Falha ao adicionar %{smart_count} arquivo devido a um erro interno',
    '1': 'Falha ao adicionar %{smart_count} arquivos devido a erros internos',
  },
  addedNumFiles: '%{numFiles} arquivo(s) adicionado(s)',
  addingMoreFiles: 'Adicionando mais arquivos',
  additionalRestrictionsFailed:
    '%{count} restrições adicionais não foram cumpridas',
  addMore: 'Adicionar mais',
  addMoreFiles: 'Adicionar mais arquivos',
  aggregateExceedsSize:
    'Você selecionou %{size} de arquivos, mas o tamanho máximo permitido é %{sizeAllowed}',
  allFilesFromFolderNamed: 'Todos os arquivos da pasta %{name}',
  allowAccessDescription:
    'Para poder tirar fotos e gravar vídeos com sua câmera, por favor permita o acesso a câmera para esse site.',
  allowAccessTitle: 'Por favor, permita o acesso à sua câmera',
  allowAudioAccessDescription:
    'Para poder gravar áudio, por favor permita o acesso ao microfone para esse site.',
  allowAudioAccessTitle: 'Por favor, permita o acesso ao microfone',
  aspectRatioLandscape: 'Recortar paisagem (16:9)',
  aspectRatioPortrait: 'Recortar retrato (9:16)',
  aspectRatioSquare: 'Recortar quadrado',
  authAborted: 'Autenticação cancelada',
  authenticate: 'Conectar',
  authenticateWith: 'Conectar com %{pluginName}',
  authenticateWithTitle:
    'Por favor conecte com %{pluginName} para selecionar arquivos',
  back: 'Voltar',
  browse: 'navegar',
  browseFiles: 'selecionar arquivos',
  browseFolders: 'selecionar pastas',
  cancel: 'Cancelar',
  cancelUpload: 'Cancelar envio',
  closeModal: 'Fechar Janela',
  companionError: 'Conexão com serviço falhou',
  companionUnauthorizeHint:
    'Para desautorizar sua conta %{provider}, por favor vá para %{url}',
  complete: 'Concluir',
  compressedX: '%{size} salvos ao comprimir imagens',
  compressingImages: 'Comprimindo imagens...',
  connectedToInternet: 'Conectado à internet',
  copyLink: 'Copiar link',
  copyLinkToClipboardFallback: 'Copiar URL abaixo',
  copyLinkToClipboardSuccess: 'Link copiado para a área de transferência',
  creatingAssembly: 'Preparando envio de arquivos...',
  creatingAssemblyFailed: 'Transloadit: Não foi possível criar o Assembly',
  dashboardTitle: 'Painel de Envio',
  dashboardWindowTitle:
    'Painel de envio de arquivos (pressione Esc para fechar)',
  dataUploadedOfTotal: '%{complete} de %{total}',
  dataUploadedOfUnknown: '%{complete} de total desconhecido',
  discardMediaFile: 'Descartar mídia',
  discardRecordedFile: 'Descartar gravação',
  done: 'Concluído',
  dropHint: 'Solte ou cole seus arquivos aqui',
  dropPasteBoth:
    'Solte ou cole arquivos aqui, %{browseFiles} ou %{browseFolders}',
  dropPasteFiles: 'Solte ou cole arquivos aqui ou %{browseFiles}',
  dropPasteFolders: 'Solte ou cole arquivos aqui ou %{browseFolders}',
  dropPasteImportBoth:
    'Solte ou cole arquivos aqui, %{browseFiles}, %{browseFolders} ou importe de:',
  dropPasteImportFiles:
    'Solte ou cole arquivos aqui ou %{browseFiles} ou importe de:',
  dropPasteImportFolders:
    'Solte ou cole arquivos aqui ou %{browseFolders} ou importe de:',
  editFile: 'Editar arquivo',
  editFileWithFilename: 'Editar arquivo %{file}',
  editImage: 'Editar imagem',
  editing: 'Editando %{file}',
  emptyFolderAdded: 'Nenhum arquivo foi adicionado da pasta vazia',
  encoding: 'Codificando...',
  enterCorrectUrl:
    'URL incorreta: Por favor, certifique-se de que você inseriu um link direto para um arquivo',
  enterTextToSearch: 'Digite texto para buscar imagens',
  enterUrlToImport: 'Insira a URL para importar um arquivo',
  error: 'Erro',
  exceedsSize: '%{file} excede o tamanho máximo permitido de %{size}',
  failedToFetch: 'Falha ao buscar esta URL. Verifique se ela está correta.',
  failedToUpload: 'Falha ao enviar %{file}',
  filesUploadedOfTotal: {
    '0': '%{complete} de %{smart_count} arquivo enviado',
    '1': '%{complete} de %{smart_count} arquivos enviados',
  },
  filter: 'Filtrar',
  finishEditingFile: 'Finalizar edição de arquivo',
  flipHorizontal: 'Inverter',
  folderAdded: {
    '0': 'Adicionado %{smart_count} arquivo de %{folder}',
    '1': 'Adicionado %{smart_count} arquivos de %{folder}',
  },
  folderAlreadyAdded: 'A pasta "%{folder}" já foi adicionada',
  generatingThumbnails: 'Gerando thumbnails...',
  import: 'Importar',
  importFiles: 'Importar arquivos de:',
  importFrom: 'Importar de %{name}',
  inferiorSize:
    'Este arquivo é menor que o tamanho máximo permitido de %{size}',
  loadedXFiles: '%{numFiles} arquivo(s) carregado(s)',
  loading: 'Carregando...',
  logIn: 'Entrar',
  logOut: 'Sair',
  micDisabled: 'Acesso ao microfone negado pelo usuário',
  missingRequiredMetaField: 'Campos meta obrigatórios faltando',
  missingRequiredMetaFieldOnFile:
    'Campos meta obrigatórios faltando em %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Campo meta obrigatório faltando: %{fields}.',
    '1': 'Campos meta obrigatórios faltando: %{fields}.',
  },
  myDevice: 'Meu dispositivo',
  noAudioDescription:
    'Para gravar áudio, por favor conecte um microfone ou outro dispositivo de entrada de áudio',
  noAudioTitle: 'Nenhum microfone disponível',
  noCameraDescription:
    'Para tirar fotos ou gravar vídeos, por favor conecte uma câmera',
  noCameraTitle: 'Nenhuma câmera disponível',
  noDuplicates:
    "Não é possível adicionar o arquivo '%{fileName}', ele já foi adicionado",
  noFilesFound: 'Você não possui arquivos ou pastas aqui',
  noInternetConnection: 'Sem conexão com a internet',
  noMoreFilesAllowed: 'Não é possível adicionar mais arquivos',
  noSearchResults: 'Infelizmente, não há resultados para esta busca',
  openFolderNamed: 'Abrir pasta %{name}',
  pause: 'Pausar',
  paused: 'Pausado',
  pauseUpload: 'Pausar envio de arquivos',
  pickFiles: 'Selecionar arquivos',
  pickPhotos: 'Selecionar fotos',
  pleaseWait: 'Por favor aguarde',
  pluginNameAudio: 'Áudio',
  pluginNameBox: 'Box',
  pluginNameCamera: 'Câmera',
  pluginNameDropbox: 'Dropbox',
  pluginNameFacebook: 'Facebook',
  pluginNameGoogleDrive: 'Google Drive',
  pluginNameGoogleDrivePicker: 'Google Drive',
  pluginNameGooglePhotosPicker: 'Google Photos',
  pluginNameInstagram: 'Instagram',
  pluginNameOneDrive: 'OneDrive',
  pluginNameScreenCapture: 'Screencast',
  pluginNameUnsplash: 'Unsplash',
  pluginNameUrl: 'Link',
  pluginNameWebdav: 'WebDAV',
  pluginNameZoom: 'Zoom',
  pluginWebdavInputLabel:
    'URL WebDAV para um arquivo (exemplo: ownCloud ou Nextcloud)',
  poweredBy: 'Desenvolvido por %{uppy}',
  processingXFiles: {
    '0': 'Processando %{smart_count} arquivo',
    '1': 'Processando %{smart_count} arquivos',
  },
  recording: 'Gravando',
  recordingLength: 'Duração da gravação %{recording_length}',
  recordingStoppedMaxSize:
    'Gravação parada porque o tamanho do arquivo está prestes a exceder o limite',
  recordVideoBtn: 'Gravar vídeo',
  recoveredAllFiles:
    'Todos os arquivos foram restaurados. Você pode retomar o envio.',
  recoveredXFiles: {
    '0': 'Não foi possível restaurar 1 arquivo. Por favor, selecione-o novamente e retome o envio.',
    '1': 'Não foi possível restaurar %{smart_count} arquivos. Por favor, selecione-os novamente e retome o envio.',
  },
  removeFile: 'Remover arquivo',
  reSelect: 'Re-selecionar',
  resetFilter: 'Restaurar filtro',
  resetSearch: 'Restaurar busca',
  resume: 'Retomar',
  resumeUpload: 'Retomar envio de arquivos',
  retry: 'Tentar novamente',
  retryUpload: 'Tentar enviar novamente',
  revert: 'Reverter',
  rotate: 'Girar',
  save: 'Salvar',
  saveChanges: 'Salvar alterações',
  search: 'Buscar',
  searchImages: 'Buscar por imagens',
  selectX: {
    '0': 'Selecionar %{smart_count}',
    '1': 'Selecionar %{smart_count}',
  },
  sessionRestored: 'Sessão restaurada',
  showErrorDetails: 'Mostrar detalhes do erro',
  signInWithGoogle: 'Entrar com Google',
  smile: 'Sorria!',
  startAudioRecording: 'Iniciar gravação de áudio',
  startCapturing: 'Iniciar captura de tela',
  startRecording: 'Começar gravação de vídeo',
  stopAudioRecording: 'Parar gravação de áudio',
  stopCapturing: 'Parar captura de tela',
  stopRecording: 'Parar gravação de vídeo',
  streamActive: 'Stream ativo',
  streamPassive: 'Stream inativo',
  submitRecordedFile: 'Enviar arquivo gravado',
  takePicture: 'Tirar uma foto',
  takePictureBtn: 'Tirar foto',
  takeScreenshot: 'Tirar screenshot',
  unnamed: 'Sem nome',
  upload: 'Enviar arquivos',
  uploadComplete: 'Envio de arquivos finalizado',
  uploadFailed: 'Envio de arquivos falhou',
  uploading: 'Enviando',
  uploadingXFiles: {
    '0': 'Enviando %{smart_count} arquivo',
    '1': 'Enviando %{smart_count} arquivos',
  },
  uploadPaused: 'Envio de arquivos pausado',
  uploadStalled:
    'Envio não fez nenhum progresso por %{seconds} segundos. Você pode tentar novamente.',
  uploadXFiles: {
    '0': 'Enviar %{smart_count} arquivo',
    '1': 'Enviar %{smart_count} arquivos',
  },
  uploadXNewFiles: {
    '0': 'Enviar +%{smart_count} arquivo',
    '1': 'Enviar +%{smart_count} arquivos',
  },
  xFilesSelected: {
    '0': '%{smart_count} arquivo selecionado',
    '1': '%{smart_count} arquivos selecionados',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} arquivo adicionado',
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
  zoomIn: 'Aumentar o zoom',
  zoomOut: 'Diminuir o zoom',
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.pt_BR = pt_BR
}

export default pt_BR
