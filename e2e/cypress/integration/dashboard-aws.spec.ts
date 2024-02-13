describe('Dashboard with @uppy/aws-s3', () => {
  beforeEach(() => {
    cy.visit('/dashboard-aws')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept({ method: 'GET', pathname: '/s3/params' }).as('get')
    cy.intercept({ method: 'POST' }).as('post')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', {
      force: true,
    })

    cy.get('.uppy-StatusBar-actionBtn--upload').click()
    cy.wait(['@post', '@get'])
    cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
  })
})
