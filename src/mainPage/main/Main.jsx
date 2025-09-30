import React from 'react';
import './Main.css';
import { useNavigate } from 'react-router-dom';

function Main() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="main">
        <div className="offer-box">
          <h1>Banka v telefonu</h1>
          <p>Získejte osobní kreditní limit bez nutnosti chodit do banky.</p>
          <div className="top-section">
            <button
              className="register-button"
              aria-label="Zaregistrovat se"
              onClick={() => navigate('/register')}
            >
              Zaregistrovat se
            </button>
            <div className="login-text">
              Máte již účet?
              <button
                className="login-link"
                onClick={() => navigate('/login')}
                aria-label="Přejít na přihlášení"
              >
                Přihlásit se
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>Bez poplatků</h3>
          <p>Žádné skryté platby. Vše přehledné a férové.</p>
        </div>
        <div className="feature">
          <h3>Převody 24/7</h3>
          <p>Okamžité převody rodině i přátelům kdykoliv.</p>
        </div>
        <div className="feature">
          <h3>Cashback</h3>
          <p>Získejte cashback za každodenní nákupy přímo na kartu.</p>
        </div>
      </div>
    </div>
  );
}

export default Main;
