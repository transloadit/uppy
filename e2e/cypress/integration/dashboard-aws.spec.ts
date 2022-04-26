describe('dashboard-aws', () => {
  beforeEach(() => {
    cy.visit('/dashboard-aws')
    cy.get('.uppy-Dashboard-input').as('file-input')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').attachFile('images/cat.jpg')
    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
