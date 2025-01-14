import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';



const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('${apiUrl}/api/auth/local/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jwt', data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        
        setMessage({
          text: '✨ Registration successful! Welcome to Music App!',
          type: 'success'
        });

        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          navigate('/user');
        }, 2000);
      } else {
        setMessage({
          text: `❌ ${data.error.message || 'Registration failed'}`,
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: '❌ An error occurred during registration',
        type: 'error'
      });
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        {message.text && (
          <div className={`alert ${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="back-link" onClick={() => navigate('/')}>
          <i className="fas fa-chevron-left"></i>
          <span>Back to Music</span>
        </div>
        <div className="register-header">
          <h1>Create Account</h1>
        </div>
        
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button type="submit" className="register-submit-btn">
            SIGN UP
          </button>

          <p className="login-link">
            Already have an account? <a href="/login">Log In</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
