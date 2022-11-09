describe('Dashboard with @uppy/aws-s3-multipart', () => {
  beforeEach(() => {
    cy.visit('/dashboard-aws-multipart')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
    cy.intercept({ method: 'POST', pathname: '/s3/multipart' }).as('post')
    cy.intercept({ method: 'GET', pathname: '/s3/multipart/*/1' }).as('get')
    cy.intercept({ method: 'PUT' }).as('put')
  })

  it('should upload cat image successfully', () => {
    cy.get('@file-input').selectFile('cypress/fixtures/images/cat.jpg', { force:true })

    cy.get('.uppy-StatusBar-actionBtn--upload').click().then(() => {
      cy.wait(['@post', '@get', '@put']).then(() => {
        cy.get('.uppy-StatusBar-statusPrimary').should('contain', 'Complete')
      })
    })
  })
})
