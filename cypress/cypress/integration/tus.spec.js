describe('Dashboard', () => {
  it('should work', async () => {
    cy.visit('/dashboard')
    const input = await cy.get('.uppy-Dashboard-input')
    await input.setValue(path.join(__dirname, '../../resources/image.jpg'))
  })
})
