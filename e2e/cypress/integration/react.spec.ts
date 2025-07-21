describe('@uppy/react', () => {
  beforeEach(() => {
    cy.visit('/react')
    cy.get('#dashboard .uppy-Dashboard-input:first').as('dashboard-input')
    cy.get('#modal .uppy-Dashboard-input:first').as('modal-input')
    cy.get('#drag-drop #file-input').as('dragdrop-input')
  })

  it('should render Dashboard in React and show thumbnails', () => {
    cy.get('@dashboard-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )
    cy.get('#dashboard .uppy-Dashboard-Item-previewImg')
      .should('have.length', 2)
      .each((element) => expect(element).attr('src').to.include('blob:'))
  })

  it('should render Dashboard with Remote Sources plugin pack', () => {
    const sources = [
      'My Device',
      'Google Drive',
      'OneDrive',
      'Unsplash',
      'Zoom',
      'Link',
    ]
    cy.get('#dashboard .uppy-DashboardTab-name').each((item, index, list) => {
      expect(list).to.have.length(6)
      // Returns the current element from the loop
      expect(Cypress.$(item).text()).to.eq(sources[index])
    })
  })

  it('should render Modal in React and show thumbnails', () => {
    cy.get('#open').click()
    cy.get('@modal-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )
    cy.get('#modal .uppy-Dashboard-Item-previewImg')
      .should('have.length', 2)
      .each((element) => expect(element).attr('src').to.include('blob:'))
  })

  it('should render custom dropzone using useDropzone hook and create a thumbnail with @uppy/thumbnail-generator', () => {
    const spy = cy.spy()

    // @ts-ignore fix me
    cy.window().then(({ uppy }) => uppy.on('thumbnail:generated', spy))
    cy.get('@dragdrop-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )
    // not sure how I can accurately wait for the thumbnail
    cy.wait(1000).then(() => expect(spy).to.be.called)
  })
})
