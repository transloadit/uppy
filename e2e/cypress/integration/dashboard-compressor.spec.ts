function uglierBytes(text) {
  const KB = 2 ** 10
  const MB = KB * KB

  if (text.endsWith(' KB')) {
    return Number(text.slice(0, -3)) * KB
  }

  if (text.endsWith(' MB')) {
    return Number(text.slice(0, -3)) * MB
  }

  if (text.endsWith(' B')) {
    return Number(text.slice(0, -2))
  }

  throw new Error(
    `Not what the computer thinks a human-readable size string look like:  ${text}`,
  )
}

describe('dashboard-compressor', () => {
  beforeEach(() => {
    cy.visit('/dashboard-compressor')
    cy.get('.uppy-Dashboard-input:first').as('file-input')
  })

  it('should compress images', () => {
    const sizeBeforeCompression = []

    cy.get('@file-input').selectFile(
      [
        'cypress/fixtures/images/cat.jpg',
        'cypress/fixtures/images/traffic.jpg',
      ],
      { force: true },
    )

    cy.get('.uppy-Dashboard-Item-statusSize').each((element) => {
      const text = element.text()
      sizeBeforeCompression.push(uglierBytes(text))
    })

    cy.window().then(({ uppy }) => {
      uppy.on('preprocess-complete', (file) => {
        expect(file.extension).to.equal('webp')
        expect(file.type).to.equal('image/webp')

        cy.get('.uppy-Dashboard-Item-statusSize').should((elements) => {
          expect(elements).to.have.length(sizeBeforeCompression.length)

          for (let i = 0; i < elements.length; i++) {
            expect(sizeBeforeCompression[i]).to.be.greaterThan(
              uglierBytes(elements[i].textContent),
            )
          }
        })
      })

      cy.get('.uppy-StatusBar-actionBtn--upload').click()
    })
  })
})
