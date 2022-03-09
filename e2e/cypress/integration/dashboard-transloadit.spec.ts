describe('Dashboard with Transloadit', () => {
  beforeEach(() => {
    cy.visit('/dashboard-transloadit')
    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.intercept('/assemblies/*').as('assemblies')
    cy.intercept('/resumable/*').as('resumable')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.wait('@assemblies')
    cy.wait('@resumable')
    cy.wait('@assemblies')

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
