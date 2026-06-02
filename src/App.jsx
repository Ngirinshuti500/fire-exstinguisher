import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { getToken, getUser } from './lib/auth';
import { setAuthToken } from './lib/api';


import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Extinguishers from './pages/Extinguishers';
import Inspections from './pages/Inspections';
import Alerts from './pages/Alerts';
import Maintenance from './pages/Maintenance';
import NotFound from './pages/NotFound';


export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) setAuthToken(token);
    setBooted(true);
  }, []);

  const user = useMemo(() => getUser(), [booted]);

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            getToken() ? (
              <ProtectedRoute roles={['Admin', 'Inspector', 'Auditor']}>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            getToken() ? <Navigate to="/" replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            getToken() ? <Navigate to="/" replace /> : <Register />
          }
        />

        <Route
          path="/locations"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Locations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/extinguishers"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Extinguishers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inspections"
          element={
            <ProtectedRoute roles={['Inspector', 'Admin']}>
              <Inspections />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute roles={['Admin', 'Inspector', 'Auditor']}>
              <Alerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance"
          element={
            <ProtectedRoute roles={['Auditor', 'Admin']}>
              <Maintenance />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            getToken() ? <NotFound /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

