import type { Locale } from '@uppy/utils'

const fr_FR: Locale<0 | 1> = {
  strings: {},
  pluralize(n) {
    if (n <= 1) {
      return 0
    }
    return 1
  },
}

fr_FR.strings = {
  addBulkFilesFailed: {
    '0': 'L’ajout de %{smart_count} fichier a échoué en raison d’une erreur interne',
    '1': 'L’ajout de %{smart_count} fichiers a échoué en raison d’erreurs internes',
  },
  addedNumFiles: '%{numFiles} fichier(s) ajouté(s)',
  addingMoreFiles: 'Ajout de fichiers',
  additionalRestrictionsFailed:
    '%{count} restrictions supplémentaires n’ont pas été respectées',
  addMore: 'Ajouter d’autres',
  addMoreFiles: 'Ajouter d’autres fichiers',
  aggregateExceedsSize:
    'Vous avez sélectionné %{size} de fichiers, mais la taille maximale autorisée est %{sizeAllowed}',
  allFilesFromFolderNamed: 'Tous les fichiers du dossier %{name}',
  allowAccessDescription:
    'Pour prendre des photos ou enregistrer une vidéo, veuillez autoriser l’accès à votre caméra pour ce site.',
  allowAccessTitle: 'Veuillez autoriser l’accès à votre caméra',
  allowAudioAccessDescription:
    'Pour enregistrer de l’audio, veuillez autoriser l’accès au microphone pour ce site.',
  allowAudioAccessTitle: 'Veuillez autoriser l’accès au microphone',
  aspectRatioLandscape: 'Recadrer en paysage (16:9)',
  aspectRatioPortrait: 'Recadrer en portrait (9:16)',
  aspectRatioSquare: 'Recadrer pour obtenir une photo carrée',
  authAborted: 'Authentification interrompue',
  authenticateWith: 'Se connecter à %{pluginName}',
  authenticateWithTitle:
    'Veuillez vous authentifier avec %{pluginName} pour sélectionner les fichiers',
  back: 'Retour',
  browse: 'naviguer',
  browseFiles: 'naviguer dans les fichiers',
  browseFolders: 'naviguer dans les dossiers',
  cancel: 'Annuler',
  cancelUpload: 'Annuler le téléversement',
  closeModal: 'Fermer la fenêtre',
  companionError: 'Connexion à Companion a échoué',
  companionUnauthorizeHint:
    'Pour vous déconnecter de votre compte %{provider}, veuillez aller à %{url}',
  complete: 'Terminé',
  compressedX: '%{size} économisé(s) par la compression',
  compressingImages: 'Compression des images…',
  connectedToInternet: 'Connecté à Internet',
  copyLink: 'Copier le lien',
  copyLinkToClipboardFallback: 'Copier le lien ci-dessous',
  copyLinkToClipboardSuccess: 'Lien copié',
  creatingAssembly: 'Préparation du téléversement…',
  creatingAssemblyFailed: 'Transloadit: Impossible de créer Assembly',
  dashboardTitle: 'Téléverseur de fichiers',
  dashboardWindowTitle:
    'Fenêtre de téléversement de fichiers (Appuyez sur Échap pour fermer)',
  dataUploadedOfTotal: '%{complete} sur %{total}',
  discardRecordedFile: 'Supprimer le fichier enregistré',
  done: 'Terminé',
  dropHint: 'Déposez vos fichiers ici',
  dropPasteBoth: 'Déposer les fichiers ici, coller ou %{browse}',
  dropPasteFiles: 'Déposer les fichiers ici, coller ou %{browse}',
  dropPasteFolders: 'Déposer les fichiers ici, coller ou %{browse}',
  dropPasteImportBoth:
    'Déposer les fichiers ici, coller, %{browse} ou importer de',
  dropPasteImportFiles:
    'Déposer les fichiers ici, coller, %{browse} ou importer de',
  dropPasteImportFolders:
    'Déposer les fichiers ici, coller, %{browse} ou importer de',
  editFile: 'Modifier le fichier',
  editImage: 'Modifier l’image',
  editFileWithFilename: 'Modifier le fichier %{file}',
  editing: 'Modification en cours de %{file}',
  emptyFolderAdded: 'Aucun fichier n’a été ajouté depuis un dossier vide',
  encoding: 'Traitement…',
  enterCorrectUrl:
    'Lien incorrect: Assurez-vous que vous entrez un lien direct vers le fichier',
  enterTextToSearch: 'Entrez un texte pour rechercher des images',
  enterUrlToImport: 'Entrez le lien pour importer un fichier',
  error: 'Erreur',
  exceedsSize:
    'Le fichier %{file} dépasse la taille maximale autorisée de %{size}',
  failedToFetch:
    'Companion a échoué à récupérer ce lien, assurez-vous qu’il est correct',
  failedToUpload: 'Le téléversement de %{file} a échoué',
  fileSource: 'Fichier source: %{name}',
  filesUploadedOfTotal: {
    '0': '%{complete} sur %{smart_count} fichier téléversé',
    '1': '%{complete} sur %{smart_count} fichiers téléversés',
  },
  filter: 'Filtrer',
  finishEditingFile: 'Terminer l’édition du fichier',
  flipHorizontal: 'Retourner horizontalement',
  folderAdded: {
    '0': '%{smart_count} fichier ajouté de %{folder}',
    '1': '%{smart_count} fichiers ajoutés de %{folder}',
  },
  folderAlreadyAdded: 'Le dossier "%{folder}" a déjà été ajouté',
  generatingThumbnails: 'Génération des vignettes…',
  import: 'Importer',
  importFiles: 'Importer des fichiers depuis :',
  importFrom: 'Importer de %{name}',
  inferiorSize: 'Ce fichier est plus petit que la taille autorisée de %{size}',
  loadedXFiles: 'Chargé %{numFiles} fichiers',
  loading: 'Chargement…',
  logOut: 'Déconnexion',
  micDisabled: 'Accès au micro refusé par l’utilisateur',
  missingRequiredMetaField: 'Champ méta requis manquant',
  missingRequiredMetaFieldOnFile:
    'Champs méta requis manquants dans %{fileName}',
  missingRequiredMetaFields: {
    '0': 'Champ méta requis manquant : %{fields}.',
    '1': 'Champs méta requis manquants : %{fields}.',
  },
  myDevice: 'Mon Appareil',
  noAudioDescription:
    'Pour enregistrer de l’audio, veuillez connecter un microphone ou un autre appareil d’entrée audio',
  noAudioTitle: 'Microphone non disponible',
  noCameraDescription:
    'Pour prendre des photos ou enregistrer une vidéo, veuillez connecter une caméra',
  noDuplicates: 'Impossible d’ajouter le fichier "%{fileName}", il existe déjà',
  noFilesFound: 'Vous n’avez aucun fichier ou dossier ici',
  noInternetConnection: 'Pas de connexion à Internet',
  noMoreFilesAllowed:
    'Impossible d’ajouter de nouveaux fichiers: en cours de chargement ',
  noSearchResults:
    'Malheureusement, il n’y a aucun résultat pour cette recherche',
  openFolderNamed: 'Ouvrir %{name}',
  pause: 'Pause',
  pauseUpload: 'Mettre en pause le téléversement',
  paused: 'En pause',
  poweredBy: 'Propulsé par %{uppy}',
  processingXFiles: {
    '0': 'Traitement de %{smart_count} fichier',
    '1': 'Traitement de %{smart_count} fichiers',
  },
  recording: 'Enregistrement',
  recordingLength: 'Durée d’enregistrement %{recording_length}',
  recordingStoppedMaxSize:
    'L’enregistrement s’est arrété car la taille du fichier dépasse la limite',
  recordVideoBtn: 'Enregistrer une vidéo',
  recoveredAllFiles:
    'Nous avons restauré tous les fichiers. Vous pouvez maintenant reprendre le téléversement.',
  recoveredXFiles: {
    '0': 'Nous n’avons pas pu récupérer entièrement 1 fichier. Veuillez le resélectionner et reprendre le téléversement.',
    '1': 'Nous n’avons pas pu récupérer entièrement %{smart_count} fichiers. Veuillez les resélectionner et reprendre le téléversement.',
  },
  removeFile: 'Effacer le fichier %{file}',
  resetFilter: 'Réinitialiser filtre',
  resume: 'Reprendre',
  resumeUpload: 'Reprendre le téléversement',
  retry: 'Réessayer',
  retryUpload: 'Réessayer le téléversement',
  reSelect: 'Resélectionner',
  save: 'Sauvegarder',
  saveChanges: 'Sauvegarder les modifications',
  selectFileNamed: 'Sélectionner le fichier %{name}',
  selectX: {
    '0': 'Sélectionner %{smart_count}',
    '1': 'Sélectionner %{smart_count}',
  },
  sessionRestored: 'Session restaurée',
  signInWithGoogle: 'Se connecter avec Google',
  smile: 'Souriez !',
  startRecording: 'Commencer l’enregistrement vidéo',
  stopRecording: 'Arrêter l’enregistrement vidéo',
  streamActive: 'Stream actif',
  streamPassive: 'Stream passif',
  submitRecordedFile: 'Envoyer la vidéo enregistrée',
  takePicture: 'Prendre une photo',
  takePictureBtn: 'Prendre une photo',
  timedOut: 'Téléversement bloqué durant %{seconds} secondes, annulation.',
  unselectFileNamed: 'Désélectionner le fichier %{name}',
  upload: 'Téléverser',
  uploadComplete: 'Téléversement terminé',
  uploadFailed: 'Le téléversement a échoué',
  uploadPaused: 'Téléversement mis en pause',
  uploadStalled:
    'Téléversement bloqué depuis %{seconds} secondes. Il est peut-être nécessaire de recommencer l’opération.',
  uploadXFiles: {
    '0': 'Téléverser %{smart_count} fichier',
    '1': 'Téléverser %{smart_count} fichiers',
  },
  uploadXNewFiles: {
    '0': 'Téléverser +%{smart_count} fichier',
    '1': 'Téléverser +%{smart_count} fichiers',
  },
  uploading: 'Téléversement en cours',
  uploadingXFiles: {
    '0': 'Téléversement de %{smart_count} fichier',
    '1': 'Téléversement de %{smart_count} fichiers',
  },
  xFilesSelected: {
    '0': '%{smart_count} fichier sélectionné',
    '1': '%{smart_count} fichiers sélectionnés',
  },
  xMoreFilesAdded: {
    '0': '%{smart_count} autre fichier ajouté',
    '1': '%{smart_count} autres fichiers ajoutés',
  },
  xTimeLeft: '%{time} restantes',
  youCanOnlyUploadFileTypes: 'Vous pouvez seulement téléverser: %{types}',
  youCanOnlyUploadX: {
    '0': 'Vous pouvez seulement téléverser %{smart_count} fichier',
    '1': 'Vous pouvez seulement téléverser %{smart_count} fichiers',
  },
  youHaveToAtLeastSelectX: {
    '0': 'Vous devez sélectionner au moins %{smart_count} fichier',
    '1': 'Vous devez sélectionner au moins %{smart_count} fichiers',
  },
}

// @ts-ignore untyped
if (typeof Uppy !== 'undefined') {
  // @ts-ignore untyped
  globalThis.Uppy.locales.fr_FR = fr_FR
}

export default fr_FR
