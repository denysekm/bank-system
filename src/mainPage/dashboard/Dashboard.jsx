import React, { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);

  const cards = [
    { number: '1234 5678 9012 3456', cvv: '123', endDate: '12/25', balance: '12 345 UAH', type: 'Debit' },
    { number: '9876 5432 1098 7654', cvv: '456', endDate: '11/26', balance: '5 000 UAH', type: 'Credit' }
  ];

  const transactions = [
    { sender: 'Ivan', receiver: 'Petro', amount: '500 ₴', note: 'Oběd', date: '27.09.2025 12:00' },
    { sender: 'Firma', receiver: 'Ivan', amount: '25 000 ₴', note: 'Výplata', date: '26.09.2025 09:00' }
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleSubmenu = () => setSubmenuOpen(!submenuOpen);

  const nextCard = () => setCurrentCard((prev) => (prev + 1) % (cards.length + 1));
  const prevCard = () => setCurrentCard((prev) => (prev - 1 + (cards.length + 1)) % (cards.length + 1));

  return (
    <div className="dashboard-wrapper">
      {/* Tlačítko menu */}
      <div className="menu-btn" onClick={toggleMenu}>&#9776;</div>

      {/* Boční menu */}
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button className="closebtn" onClick={toggleMenu}>&times;</button>

        <a href="#analytics">Analytika</a>

        <button className="submenu-toggle" onClick={toggleSubmenu}>
          Nastavení bezpečnosti
        </button>
        {submenuOpen && (
          <div className="submenu">
            <a href="#edit-name">Změnit jméno</a>
            <a href="#change-password">Změnit heslo</a>
            <a href="#change-login">Změnit login</a>
            <a href="#change-address">Změnit adresu</a>
            <a href="#change-phone">Změnit telefon</a>
            <a href="#change-birthdate">Změnit datum narození</a>
            <a href="#change-client-type">Změnit typ klienta</a>
            <a href="#change-passport">Změnit číslo pasu</a>
          </div>
        )}

        <a href="#replenish">Dobít účet</a>
        <a href="#transfer">Převod peněz</a>
        <a href="#mobile">Dobít mobil</a>
        <a href="#credit">Žádost o kredit</a>
        <a href="#repayCredit">Splatit kredit</a>
      </div>

      <div className="container">
        {/* Odhlášení */}
        <div className="logout-container">
          <span className="logout-icon">⎋</span>
        </div>

        {/* Klientská informace */}
        <div className="section">
          <h2>Informace o klientovi</h2>
          <div className="info-grid">
            <div className="info-item"><strong>Jméno:</strong> Ivan Ivanov</div>
            <div className="info-item"><strong>Telefon:</strong> +420 123 456 789</div>
            <div className="info-item"><strong>Adresa:</strong> Praha, Česká republika</div>
            <div className="info-item"><strong>Číslo pasu:</strong> AB123456</div>
            <div className="info-item"><strong>Typ klienta:</strong> Premium</div>
          </div>
        </div>

        {/* Bankovní karty */}
        <div className="section">
          <h2>Bankovní karty</h2>

          <div className="cards-container-wrapper">
            <button className="arrow" onClick={prevCard}>◀</button>

            <div className="cards-container">
              {cards.map((card, index) => (
                <div key={index} className={`card ${currentCard === index ? 'active' : ''}`}>
                  <div className="card-number">{card.number}</div>
                  <div className="card-holder">
                    <div><strong>CVV:</strong> {card.cvv}</div>
                    <div><strong>Platnost:</strong> {card.endDate}</div>
                  </div>
                  <div className="card-balance"><strong>Zůstatek:</strong> {card.balance}</div>
                  <div className="card-type">{card.type}</div>
                </div>
              ))}

              {/* Přidat novou kartu */}
              <div className={`card add-card ${currentCard === cards.length ? 'active' : ''}`}>
                <span>+</span>
              </div>
            </div>

            <button className="arrow" onClick={nextCard}>▶</button>
          </div>
        </div>

        {/* Poslední transakce */}
        <div className="transactions-container">
          <h2>Poslední transakce</h2>
          <div className="transactions-list">
            {transactions.map((t, idx) => (
              <div key={idx} className="transaction-item">
                <div><strong>Odesílatel:</strong> {t.sender}</div>
                <div><strong>Příjemce:</strong> {t.receiver}</div>
                <div><strong>Částka:</strong> {t.amount}</div>
                <div><strong>Poznámka:</strong> {t.note}</div>
                <div><strong>Datum:</strong> {t.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
