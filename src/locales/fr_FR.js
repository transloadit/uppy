/* eslint camelcase: 0 */

const fr_FR = {}

fr_FR.strings = {
  chooseFile: 'Sélectionnez un fichier',
  youHaveChosen: 'Vous avez sélectionné: %{fileName}',
  orDragDrop: 'ou glissez-le ici',
  filesChosen: {
    0: '%{smart_count} fichier sélectionné',
    1: '%{smart_count} fichiers sélectionnés'
  },
  filesUploaded: {
    0: '%{smart_count} fichier envoyé',
    1: '%{smart_count} fichiers envoyés'
  },
  files: {
    0: '%{smart_count} fichier',
    1: '%{smart_count} fichiers'
  },
  uploadFiles: {
    0: 'Envoyer %{smart_count} fichier',
    1: 'Envoyer %{smart_count} fichiers'
  },
  selectToUpload: 'Sélectionnez des fichiers à envoyer',
  closeModal: 'Fermer',
  upload: 'Envoyer',
  importFrom: 'Importer des fichiers depuis',
  dashboardWindowTitle: 'Panneau de contrôle d\'Uppy (Appuyez sur échap. pour le fermer)',
  dashboardTitle: 'Panneau de contrôle d\'Uppy',
  copyLinkToClipboardSuccess: 'Lien copié dans le presse-papier.',
  copyLinkToClipboardFallback: 'Copiez l\'URL ci-dessous',
  done: 'Terminé',
  localDisk: 'Fichiers locaux',
  dropPasteImport: 'Glissez des fichiers ici, collez-en, ou importez les depuis les plate-formes ci-dessus.',
  dropPaste: 'Glissez des fichiers ici, ou collez-en',
  browse: 'Naviguer',
  fileProgress: 'Progression: vitesse d\'envoi et temps d\'attente estimé',
  numberOfSelectedFiles: 'Nombre de fichiers sélectionnés',
  uploadAllNewFiles: 'Envoyer tous les nouveaux fichiers'
}

fr_FR.pluralize = function (n) {
  if (n === 1) {
    return 0
  }
  return 1
}

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.fr_FR = fr_FR
}

module.exports = fr_FR
