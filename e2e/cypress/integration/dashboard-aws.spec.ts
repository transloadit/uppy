describe('Dashboard with @uppy/aws-s3', () => {
  beforeEach(() => {
    cy.visit('/dashboard-aws')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.get('.uppy-StatusBar-actionBtn--upload').click().then(() => {
      cy.wait(['@assemblies', '@resumable']).then(() => {
        cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
      })
    })
  })
})
