// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import DriverForm from './DriverForm';
import Dashboard from './Dashboard';
import Login from './Login';
import './App.css';

function App() {
  // Check browser storage to see if an admin session is already active
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('isAdminAuthenticated') === 'true'
  );

  return (
    <div>
      <nav className="nav-container">
        <Link to="/" className="nav-link">📋 Driver Portal</Link>
        <Link to="/dashBoard" className="nav-link">📊 Management Dashboard</Link>
      </nav>

      <Routes>
        {/* Route 1: Drivers access form freely */}
        <Route path="/" element={<DriverForm />} />

        {/* Route 2: Login form passway */}
        <Route 
          path="/login" 
          element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} 
        />

        {/* Route 3: SECURE PROTECTED DASHBOARD ROUTE */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;