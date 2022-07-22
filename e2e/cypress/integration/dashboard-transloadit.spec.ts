describe('Dashboard with Transloadit', () => {
  beforeEach(() => {
    cy.visit('/dashboard-transloadit')
    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.intercept('/assemblies').as('createAssemblies')
    cy.intercept('/assemblies/*').as('assemblies')
    cy.intercept('/resumable/*').as('resumable')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@assemblies')
    cy.wait('@resumable')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })

  it('should close assembly polling when cancelled', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.intercept({
      method: 'GET',
      url: '/assemblies/*',
    }).as('assemblyPolling')
    cy.intercept(
      { method: 'PATCH', pathname: '/files/*', times: 1 },
      { statusCode: 204, body: {} },
    )
    cy.intercept(
      { method: 'DELETE', pathname: '/resumable/files/*', times: 1 },
      { statusCode: 204, body: {} },
    )
    cy.wait('@assemblyPolling')
    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).every((a: any) => a.pollInterval)).to.equal(true)
    })
    cy.get('button[data-cy=cancel]').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
    })
  })

  it('should not create assembly when all individual files have been cancelled', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).length).to.equal(0)

      const { files } = uppy.getState()
      uppy.removeFiles(Object.keys(files))

      cy.wait('@createAssemblies').then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(false)
      })
    })
  })

  it('should create assembly if there is still one file to upload', () => {
    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.window().then(({ uppy }) => {
      expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).length).to.equal(0)

      const { files } = uppy.getState()
      const [fileID] = Object.keys(files)
      uppy.removeFile(fileID)

      cy.wait('@createAssemblies').then(() => {
        expect(Object.values(uppy.getPlugin('Transloadit').activeAssemblies).some((a: any) => a.pollInterval)).to.equal(true)
        cy.wait('@resumable')

        cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
      })
    })
  })

  it('should not emit error if upload is cancelled right away', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    const handler = cy.spy()

    cy.window().then(({ uppy }) => {
      const { files } = uppy.getState()
      uppy.on('upload-error', handler)

      const [fileID] = Object.keys(files)
      uppy.removeFile(fileID)
      uppy.removeFile(fileID)
      cy.wait('@createAssemblies').then(() => expect(handler).not.to.be.called)
    })
  })
})
