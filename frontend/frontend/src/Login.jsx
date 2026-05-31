// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- 🛑 DEPLOYMENT NOTE FOR PRODUCTION ---
    // For local testing, we look for this hardcoded manager profile match block.
    // In production, swap this for an axios.post() call hitting a secure backend database verification route!
    if (username === 'admin' && password === 'SRTL_secure_2026') {
      
      // Authorize browser session memory tracks
      localStorage.setItem('isAdminAuthenticated', 'true');
      
      // Update our top-level routing switch state
      onLoginSuccess();
      
      // Smoothly push manager into the control room workspace
      navigate('/dashboard');
    } else {
      setError('Invalid Manager Credentials. Access Denied.');
      setLoading(false);
    }
  };

  return (
    <div className="login-canvas">
      <div className="login-box-card">
        <div className="login-header">
          <h2>SRTL Fleet Systems</h2>
          <p>Management Authentication Gateway</p>
        </div>

        <form onSubmit={handleLogin}>
          <label>Control Username</label>
          <input 
            type="text" 
            placeholder="Enter admin ID..." 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />

          <label>Security Password</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          {error && <div className="login-error-banner">❌ {error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Verifying Identity...' : 'Authorize Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;