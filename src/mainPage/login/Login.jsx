import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};
    if (!login) newErrors.login = "Pole je povinné";
    if (!password) newErrors.password = "Pole je povinné";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({
          form: data.error || "Přihlášení selhalo",
        });
        setLoading(false);
        return;
      }

      // uložíme přihlášeného uživatele do kontextu
      setUser({
        login,
        password, // necháváme plaintext pro Basic Auth při volání backendu
        id: data.user.id,
        clientId: data.user.clientId,
        role: data.user.role,
      });

      // přejdeme na dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({
        form: "Chyba spojení se serverem",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-background">
      <div className="form-container">
        {/* Křížek vpravo nahoře */}
        <button
          className="close-button"
          aria-label="Zavřít"
          onClick={() => navigate("/")}
        >
          &#10005;
        </button>

        <h2>Přihlášení</h2>

        <form onSubmit={handleSubmit}>
          {/* LOGIN */}
          <div className="form-group">
            <label>Login</label>
            <input
              type="text"
              name="login"
              className={errors.login ? "invalid" : ""}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
            {errors.login && (
              <div className="error-message">{errors.login}</div>
            )}
          </div>

          {/* HESLO */}
          <div className="form-group">
            <label>Heslo</label>
            <input
              type="password"
              name="password"
              className={errors.password ? "invalid" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          {/* CHYBA FORMULÁŘE ZE SERVERU */}
          {errors.form && (
            <div className="error-message" style={{ textAlign: "center" }}>
              {errors.form}
            </div>
          )}

          {/* TLAČÍTKO ODESLAT */}
          <div className="form-group">
            <button type="submit" disabled={loading}>
              {loading ? "Přihlašování..." : "Přihlásit se"}
            </button>
          </div>
        </form>

        {/* Zapomenuté heslo / Registrace */}
        <div className="forgot-password-text">
          Nemáte účet?
          <br />
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
          >
            Zaregistrujte se
          </a>
        </div>
      </div>
    </div>
  );
}
