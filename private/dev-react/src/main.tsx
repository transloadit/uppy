/* eslint-disable react/react-in-jsx-scope */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// <div
//   style={{
//     display: 'flex',
//     height: '100vh',
//     width: '100vw',
//     flexDirection: 'column',
//   }}
// >
//   <div
//     style={{
//       flex: 1,
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'stretch',
//     }}
//   >
//     <div style={{ height: '100%' }}>
//       <img src="../react-logo.png" width={50} />
//       <Todos />
//     </div>
//   </div>
//   <div
//     style={{
//       flex: 1,
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'stretch',
//     }}
//   >
//     <iframe src="http://localhost:3001" height={'100%'} />
//   </div>
// </div>
