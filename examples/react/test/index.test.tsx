import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import App from '../src/App'

test('loads and displays greeting', async () => {
  const screen = render(<App />)
  const heading = screen.getByText('Welcome to React.')
  await expect.element(heading).toHaveTextContent('Welcome to React.')
})
