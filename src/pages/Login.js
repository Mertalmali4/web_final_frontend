import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jwt', data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        
        setMessage({
          text: `✨ Welcome back, ${data.user.username}!`,
          type: 'success'
        });

        setTimeout(() => {
          navigate('/user');
        }, 2000);
      } else {
        setMessage({
          text: '❌ Invalid username or password',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: '❌ An error occurred during login',
        type: 'error'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {message.text && (
          <div className={`alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="back-link" onClick={() => navigate('/')}>
          <i className="fas fa-chevron-left"></i>
          <span>Back to Music</span>
        </div>
        <div className="login-header">
          <h1>Music App</h1>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">Email</label>
            <input
              type="email"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn">
            LOG IN
          </button>

          <p className="signup-link">
            Don't have an account? <a href="/register">Sign Up</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
