describe('Dashboard', () => {
  it('should work', () => {
    cy.visit('/dashboard')
    cy.get('h1').should('contain', 'yeah')
  })
})
