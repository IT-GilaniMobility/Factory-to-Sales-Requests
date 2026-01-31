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
import CustomerPDFs from './pages/CustomerPDFs';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, hasDashboardAccess } = useAuth();

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

  // Check if user has dashboard access
  if (!hasDashboardAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">You do not have permission to access the dashboard.</p>
          <p className="text-gray-600">Please contact your sales representative or system administrator.</p>
        </div>
      </div>
    );
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
          path="/customer-pdfs"
          element={
            <ProtectedRoute>
              <CustomerPDFs />
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
