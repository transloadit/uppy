describe.skip('@uppy/vue', () => {
  beforeEach(() => {
    cy.visit('/dashboard-vue')
    cy.get('input[type="file"]').first().as('file-input')
  })

  it('should render headless components in Vue 3 correctly', () => {
    cy.get('@file-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )

    // Test FilesList shows files correctly
    cy.get('ul[data-uppy-element="files-list"]').should('exist')
    cy.get('ul[data-uppy-element="files-list"] li').should('have.length', 2)

    // Test FilesGrid shows files correctly
    cy.get('div[data-uppy-element="files-grid"]').should('exist')
    cy.get('div[data-uppy-element="files-grid"] div.uppy-reset').should(
      'have.length',
      2,
    )

    // Test UploadButton is functional
    cy.get('#files-grid button[data-uppy-element="upload-button"]')
      .should('exist')
      .and('contain', 'Upload')
      .and('not.be.disabled')
      .click()

    // Check if button shows progress during upload
    cy.get('#files-grid button[data-uppy-element="upload-button"] span').should(
      'contain',
      'Uploaded',
    )
    // Check if cancel button appears during upload
    cy.get('#files-grid button[data-uppy-element="cancel-button"]')
      .should('exist')
      .and('contain', 'Cancel')

    cy.get('#files-grid button[data-uppy-element="upload-button"] span').should(
      'contain',
      'Complete',
    )
  })
})
