import React, { useState } from 'react';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    passportNumber: '',
    address: '',
    phone: '',
    clientType: 'Fyzická osoba',
    login: '',
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
    if (!formData.fullName) newErrors.fullName = "Pole je povine pro vyplneni";
    if (!formData.birthDate) newErrors.birthDate = "Pole je povine pro vyplneni";
    if (!formData.passportNumber) newErrors.passportNumber = "Pole je povine";
    if (!formData.phone.match(/^\+420\d{9}$/))
      newErrors.phone = "telefoni cislo musi byt ve formatu +420XXXXXXXXX";
    if (!formData.clientType) newErrors.clientType = "Pole je povine pro vyplneni";
    if (!formData.login) newErrors.login = "Pole je povine pro vyplneni";
    if (!formData.password) newErrors.password = "Pole je povine pro vyplneni";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      alert('Форма успішно надіслана!');
    }
  };

  return (
  <div className="register-background">
    <div className="form-container">
      <button
        className="close-button"
        aria-label="Закрити форму"
        onClick={() => window.location.href = '/'}
      >
        &#10005;
      </button>

      <h2>Registrace</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Jmeno a prijmeni</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={errors.fullName ? 'invalid' : ''}
          />
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
        </div>

        <div className="form-group">
          <label>Datum narození</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={errors.birthDate ? 'invalid' : ''}
          />
          {errors.birthDate && <div className="error-message">{errors.birthDate}</div>}
        </div>

        <div className="form-group">
          <label>cislo obcasnkeho prukazu</label>
          <input
            type="text"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={handleChange}
            className={errors.passportNumber ? 'invalid' : ''}
          />
          {errors.passportNumber && <div className="error-message">{errors.passportNumber}</div>}
        </div>

        <div className="form-group">
          <label>Adresa</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Telefonni cislo</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+420XXXXXXXXX"
            className={errors.phone ? 'invalid' : ''}
          />
          {errors.phone && <div className="error-message">{errors.phone}</div>}
        </div>

        <div className="form-group">
          <label>Typ klientu</label>
          <select
            name="clientType"
            value={formData.clientType}
            onChange={handleChange}
            className={errors.clientType ? 'invalid' : ''}
          >
            <option value="Fizicka osoba">Fyzicka osoba</option>
            <option value="Právnická osoba">Právnická osoba</option>
          </select>
          {errors.clientType && <div className="error-message">{errors.clientType}</div>}
        </div>

        <div className="form-group">
          <label>Login</label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            className={errors.login ? 'invalid' : ''}
          />
          {errors.login && <div className="error-message">{errors.login}</div>}
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
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <div className="form-group">
          <button type="submit">Zaregistovat se</button>
        </div>
      </form>
    </div>
  </div>
  );
}

export default Register;
