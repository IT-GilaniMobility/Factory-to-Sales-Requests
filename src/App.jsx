import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Customer from './pages/Customer';
import RequestJobs from './pages/RequestJobs';
import RequestDetails from './pages/RequestDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/requests" replace />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/requests" element={<RequestJobs />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
