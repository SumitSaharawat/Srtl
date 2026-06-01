// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  try {
    const response = await axios.post('http://localhost:8000/api/auth/login', {
      username,
      password,
    });

    // Extract the cryptographic token from our secure server response
    const { token } = response.data;

    // Save token and session states securely inside browser cache storage
    localStorage.setItem('isAdminAuthenticated', 'true');
    localStorage.setItem('adminToken', token);

    onLoginSuccess();
    navigate('/dashboard');

  } catch (error) {
    console.error('Authentication failure:', error);
    setError(error.response?.data?.message || 'Connection timeout. Terminal authorization failed.');
  } finally {
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