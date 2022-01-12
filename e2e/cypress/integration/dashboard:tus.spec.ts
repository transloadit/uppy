describe('Dashboard with Tus', () => {
  beforeEach(() => {
    cy.visit('/dashboard')

    cy.get('.uppy-Dashboard-input').as('file-input')
    cy.get('.uppy-StatusBar-actionBtn--upload').as('upload-button')
    cy.get('.uppy-StatusBar-statusPrimary').as('status-bar')

    cy.intercept('https://tusd.tusdemo.net/files/*').as('tus')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('cat.jpg')
    cy.get('@upload-button').click()
    cy.wait('@tus')
    cy.get('@status-bar').should('contain', 'Complete')
  })
})
