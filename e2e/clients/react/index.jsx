/* eslint-disable react/react-in-jsx-scope */
// eslint-disable-next-line no-unused-vars
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const container = document.getElementById('app')
const root = createRoot(container)

root.render(<App />)
