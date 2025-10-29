import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // data o klientovi a účtu
  const [client, setClient] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // výběr karty / nový card flow
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState("DEBIT");
  const [createError, setCreateError] = useState("");

  // helper pro Authorization header
  function authHeader() {
    return `Basic ${btoa(`${user.login}:${user.password}`)}`;
  }

  // když nejsi přihlášený, vrať tě na login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // načti dashboard data (klient, karty, transakce)
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const headers = { Authorization: authHeader() };

        const [clientRes, cardsRes, txRes] = await Promise.all([
          fetch("http://localhost:5000/api/client/me", { headers }),
          fetch("http://localhost:5000/api/cards/me", { headers }),
          fetch("http://localhost:5000/api/transactions/me", { headers }),
        ]);

        // pokud už neplatná autorizace → odhlásit
        if (
          clientRes.status === 401 ||
          cardsRes.status === 401 ||
          txRes.status === 401
        ) {
          setUser(null);
          navigate("/login");
          return;
        }

        const clientData = await clientRes.json();
        const cardsData = await cardsRes.json();
        const txData = await txRes.json();

        setClient(clientData);
        setCards(cardsData);
        setTransactions(txData);
      } catch (err) {
        console.error("Chyba při načítání dashboardu:", err);
      }
    }

    load();
  }, [user, navigate, setUser]);

  // vytvoření nové karty
  async function handleConfirmCreateCard() {
    setCreateError("");

    try {
      const res = await fetch("http://localhost:5000/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        body: JSON.stringify({ cardType: newCardType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Nepodařilo se vytvořit kartu");
        return;
      }

      // backend nám vrátil novou kartu (cardNumber, cvv, endDate, balance, cardType)
      // přidáme ji do seznamu, aby se hned zobrazila
      const newCard = {
        id: data.id,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
        endDate: data.endDate,
        balance: data.balance,
        cardType: data.cardType,
      };
      setCards((prev) => [...prev, newCard]);

      // zavřeme modal
      setShowCreateCard(false);
    } catch (err) {
      console.error("Chyba při vytváření karty:", err);
      setCreateError("Chyba při vytváření karty");
    }
  }

  // helper pro hezké datum transakcí
  function formatDateTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }

  // odhlášení
  function handleLogout() {
    setUser(null);
    navigate("/", { replace: true });
  }

  console.log("DASHBOARD USER =", user);

  return (
    <div className="dashboard-page">
      {/* HEADER BAR */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-heading">Můj účet</h2>
          <div className="dashboard-subtitle">
            {client ? client.fullName : ""}
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Odhlásit se
        </button>
      </div>

      {/* LAYOUT */}
      <div className="dashboard-content">
        {/* LEVÁ ČÁST */}
        <div className="left-side">
          {/* INFO O KLIENTOVI */}
          <section className="client-info-box card">
            <h3 className="section-title">Informace o klientovi</h3>

            {!client ? (
              <p>Načítám údaje…</p>
            ) : (
              <div className="client-grid">
                <div>
                  <strong>Jméno:</strong> {client.fullName || "—"}
                </div>
                <div>
                  <strong>Telefon:</strong> {client.phone || "—"}
                </div>
                <div>
                  <strong>Adresa:</strong> {client.address || "—"}
                </div>
                <div>
                  <strong>Doklad:</strong> {client.passportNumber || "—"}
                </div>
                <div>
                  <strong>Typ klienta:</strong> {client.clientType || "—"}
                </div>
                <div>
                  <strong>Celkem peněz:</strong> {client.totalBalance} UAH
                </div>
                <div>
                  <strong>Login:</strong> {client.login}
                </div>
              </div>
            )}
          </section>

          {/* KARTY */}
          <section className="cards-box card">
            <div className="cards-header">
              <h3 className="section-title no-margin">Moje karty</h3>

              <button
                onClick={() => {
                  setCreateError("");
                  setNewCardType("DEBIT");
                  setShowCreateCard(true);
                }}
                className="create-card-btn"
              >
                Vytvořit kartu
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="cards-empty">
                Zatím nemáš žádnou kartu.
              </div>
            ) : (
              <div className="cards-list">
                {cards.map((card) => (
                  <div key={card.id} className="bank-card">
                    <div className="bank-card-number">
                      {card.cardNumber}
                    </div>

                    <div className="bank-card-row">
                      <div>
                        <strong>CVV:</strong> {card.cvv}
                      </div>
                      <div>
                        <strong>Platnost:</strong> {card.endDate}
                      </div>
                    </div>

                    <div className="bank-card-balance">
                      <strong>Balanc:</strong> {card.balance} UAH
                    </div>

                    <div className="bank-card-type">{card.cardType}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* PRAVÁ ČÁST */}
        <div className="right-side">
          <section className="transactions-box card">
            <h3 className="section-title center">Poslední transakce</h3>

            <div className="transactions-scroll">
              {transactions.length === 0 ? (
                <div className="transactions-empty">
                  Žádné transakce.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="transaction-card">
                    <div>
                      <strong>Od:</strong> {tx.sender}
                    </div>
                    <div>
                      <strong>Komu:</strong> {tx.receiver}
                    </div>
                    <div>
                      <strong>Suma:</strong> {tx.amount} ₴
                    </div>
                    <div>
                      <strong>Poznámka:</strong> {tx.note || "—"}
                    </div>
                    <div>
                      <strong>Datum:</strong>{" "}
                      {formatDateTime(tx.transactionDate)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MODAL */}
      {showCreateCard && (
        <div
          className="create-card-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="create-card-modal">
            <h3 className="modal-title">Vytvořit kartu</h3>

            <label className="modal-label">
              Typ karty:
            </label>
            <select
              value={newCardType}
              onChange={(e) => setNewCardType(e.target.value)}
              className="modal-select"
            >
              <option value="DEBIT">DEBIT</option>
              <option value="CREDIT">CREDIT</option>
            </select>

            {createError && (
              <div className="modal-error">{createError}</div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => setShowCreateCard(false)}
                className="btn-cancel"
              >
                Zrušit
              </button>

              <button
                onClick={handleConfirmCreateCard}
                className="btn-confirm"
              >
                Potvrdit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
