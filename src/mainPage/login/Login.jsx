import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Pole je povinné';
    if (!formData.password) newErrors.password = 'Pole je povinné';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Login data:', formData);
      alert('Přihlášení proběhlo úspěšně!');
    }
  };

  return (
    <div className="login-background">
      <div className="form-container">
        <button
          className="close-button"
          aria-label="Zavřít"
          onClick={() => (window.location.href = '/')}
        >
          &#10005;
        </button>

        <h2>Přihlášení</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Login</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'invalid' : ''}
            />
            {errors.username && (
              <div className="error-message">{errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label>Heslo</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'invalid' : ''}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <button type="submit">Přihlásit se</button>
          </div>
        </form>

        <div className="forgot-password-text">
          <a href="/forgotPassword">Zapomněli jste heslo?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
