import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SigningIn from './pages/SigningIn';
import Customer from './pages/Customer';
import RequestJobs from './pages/RequestJobs';
import RequestDetails from './pages/RequestDetails';
import Logs from './pages/Logs';
import Deliveries from './pages/Deliveries';
import WorkHours from './pages/WorkHours';
import CustomerForm from './pages/CustomerForm';
import CustomerMeasurementsForm from './pages/CustomerMeasurementsForm';
import CustomerFormPublic from './pages/CustomerFormPublic';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn()) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signing-in" element={<SigningIn />} />
        {/* Public routes for customer forms - no auth required */}
        <Route path="/customer-form/:token" element={<CustomerForm />} />
        <Route path="/customer-measurements/:token" element={<CustomerMeasurementsForm />} />
        <Route path="/customer-form-public/:token" element={<CustomerFormPublic />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/requests" replace />} />
        <Route path="/login" element={<Navigate to="/requests" replace />} />
        {/* Public routes for customer forms - no auth required */}
        <Route path="/customer-form/:token" element={<CustomerForm />} />
        <Route path="/customer-measurements/:token" element={<CustomerMeasurementsForm />} />
        <Route path="/customer-form-public/:token" element={<CustomerFormPublic />} />
        <Route
          path="/signing-in"
          element={
            <ProtectedRoute>
              <SigningIn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <Customer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute>
              <RequestDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deliveries"
          element={
            <ProtectedRoute>
              <Deliveries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-hours"
          element={
            <ProtectedRoute>
              <WorkHours />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
