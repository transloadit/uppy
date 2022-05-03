/* eslint-disable react/react-in-jsx-scope */
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const container = document.getElementById('app')
const root = createRoot(container)

root.render(<App />)
