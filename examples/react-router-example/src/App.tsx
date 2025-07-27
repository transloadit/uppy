import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UppyDashboard from './components/UppyDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UppyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;