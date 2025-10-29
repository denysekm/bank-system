import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    passportNumber: "",
    address: "",
    phone: "",
    clientType: "Fyzická osoba",
    login: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // validace na frontendu
  const validate = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = "Pole je povinné";
    if (!formData.birthDate) newErrors.birthDate = "Pole je povinné";
    if (!formData.passportNumber) newErrors.passportNumber = "Pole je povinné";
    if (!formData.clientType) newErrors.clientType = "Pole je povinné";
    if (!formData.login) newErrors.login = "Pole je povinné";
    if (!formData.password) newErrors.password = "Pole je povinné";

    if (
      formData.phone &&
      !/^\+420\d{9}$/.test(formData.phone)
    ) {
      newErrors.phone = "Zadej telefon ve formátu +420XXXXXXXXX";
    }

    return newErrors;
  };

  // onChange handler
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // lokální validace
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    // namapování clientType z textu v UI na hodnotu do DB
    

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: formData.login,
          password: formData.password,
          fullName: formData.fullName,
          birthDate: formData.birthDate, // YYYY-MM-DD už z input type="date"
          passportNumber: formData.passportNumber,
          address: formData.address || null,
          phone: formData.phone || null,
          clientType: formData.clientType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend nám poslal chybu (např. duplicitní PassportNumber)
        alert(data.error || "Registrace selhala.");
      } else if (data?.ok) {
        alert("Registrace proběhla úspěšně.");
        navigate("/login");
      } else {
        // neočekávaná odpověď
        alert("Něco se pokazilo při registraci.");
      }
    } catch (err) {
      console.error("Chyba při registraci:", err);
      alert("Chyba spojení se serverem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-background">
      <div className="form-container">
        <button
          className="close-button"
          aria-label="Zavřít"
          onClick={() => navigate("/")}
        >
          &#10005;
        </button>

        <h2>Registrace</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Jméno a příjmení</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? "invalid" : ""}
            />
            {errors.fullName && (
              <div className="error-message">{errors.fullName}</div>
            )}
          </div>

          <div className="form-group">
            <label>Datum narození</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={errors.birthDate ? "invalid" : ""}
            />
            {errors.birthDate && (
              <div className="error-message">{errors.birthDate}</div>
            )}
          </div>

          <div className="form-group">
            <label>Číslo občanského průkazu</label>
            <input
              type="text"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              className={errors.passportNumber ? "invalid" : ""}
            />
            {errors.passportNumber && (
              <div className="error-message">{errors.passportNumber}</div>
            )}
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
            <label>Telefonní číslo</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+420XXXXXXXXX"
              className={errors.phone ? "invalid" : ""}
            />
            {errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>

          <div className="form-group">
            <label>Typ klienta</label>
            <select
              name="clientType"
              value={formData.clientType}
              onChange={handleChange}
              className={errors.clientType ? "invalid" : ""}
            >
              <option value="Fyzická osoba">Fyzická osoba</option>
              <option value="Právnická osoba">Právnická osoba</option>
            </select>
            {errors.clientType && (
              <div className="error-message">{errors.clientType}</div>
            )}
          </div>

          <div className="form-group">
            <label>Login</label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className={errors.login ? "invalid" : ""}
            />
            {errors.login && (
              <div className="error-message">{errors.login}</div>
            )}
          </div>

          <div className="form-group">
            <label>Heslo</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "invalid" : ""}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <button type="submit" disabled={loading}>
              {loading ? "Odesílání..." : "Zaregistrovat se"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
