import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import {
  Home,
  Login,
  Signup,
  ForgotPassword,
  Dashboard,
  Profile,
  AdminPanel,
  Fields,
  NewReservation,
  Reservations,
  AllReservations,
  AdminDashboard,
  AdminUsers,
  NotFound
} from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            <Route path="/fields" element={
              <ProtectedRoute>
                <Fields />
              </ProtectedRoute>
            } />
            
            <Route path="/reservations/new" element={
              <ProtectedRoute>
                <NewReservation />
              </ProtectedRoute>
            } />
            
            <Route path="/reservations" element={
              <ProtectedRoute>
                <Reservations />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reservations" element={
              <ProtectedRoute>
                <AllReservations />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            {/* Redirecciones */}
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            
            {/* Página 404 */}
            <Route path="/error/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
