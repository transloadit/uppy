describe('Dashboard with Transloadit', () => {
  before(function before () {
    if (!globalThis.process?.env.VITE_TRANSLOADIT_KEY) {
      cy.log('No Transloadit key found in the env, skipping.')
      this.skip()
    }
  })
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

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
