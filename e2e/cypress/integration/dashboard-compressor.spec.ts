const KB = 2 ** 10
const MB = KB * KB

function humanSizeToBytes (text) {
  if (text.endsWith(' KB')) {
    return Number(text.slice(0, -3)) * KB
  }

  if (text.endsWith(' MB')) {
    return Number(text.slice(0, -3)) * MB
  }

  if (text.endsWith(' B')) {
    return Number(text.slice(0, -2))
  }

  throw new Error('Not what the computer thinks a human-readable size string look like: ' + text)
}

describe('dashboard-compressor', () => {
  beforeEach(() => {
    cy.visit('/dashboard-compressor')
    cy.get('.uppy-Dashboard-input').as('file-input')
  })

  it('should compress images', () => {
    const sizeBeforeCompression = []
    const sizeAfterCompression = []

    cy.get('@file-input').attachFile(['images/cat.jpg', 'images/traffic.jpg'])

    cy.get('.uppy-Dashboard-Item-statusSize').each((element) => {
      const text = element.text()
      sizeBeforeCompression.push(humanSizeToBytes(text))
    })

    console.log(sizeBeforeCompression)

    cy.get('.uppy-StatusBar-actionBtn--upload').click()

    cy.get('.uppy-Informer p[role="alert"]', {
      timeout: 10000,
    }).should('be.visible')

    cy.get('.uppy-Dashboard-Item-statusSize').should((elements) => {
      expect(elements).to.have.length(sizeBeforeCompression.length)

      for (let i = 0; i < elements.length; i++) {
        expect(sizeBeforeCompression[i]).to.be.greaterThan(
          humanSizeToBytes(elements[i].textContent),
        )
      }
    })

    console.log(sizeAfterCompression)

    // cy.wait('.uppy-Informer p[role="alert"]').

    // cy.get('.uppy-Dashboard-Item-previewImg')
    //   .should('have.length', 2)
    //   .each((element) => expect(element).attr('src').to.include('blob:'))
  })
})
