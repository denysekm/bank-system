import React, { useEffect, useState, useCallback } from "react";
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

  // vytvoření karty
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState("DEBIT"); // UI: DEBIT/CREDIT
  const [createError, setCreateError] = useState("");

  // nové: stavy pro operace s kartami
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [repl, setRepl] = useState({ card: "", amount: "", paymentMethod: "CARD" });
  const [cc,   setCc]   = useState({ fromCard: "", toCard: "", amount: "", description: "" });
  const [mob,  setMob]  = useState({ fromCard: "", phone: "", amount: "" });

  // bezpečný Authorization header (diakritika)
  const authHeader = useCallback(() => {
    if (!user) return "";
    const raw = `${user.login}:${user.password}`;
    const safe = btoa(unescape(encodeURIComponent(raw)));
    return `Basic ${safe}`;
  }, [user]);

  // když nejsi přihlášený, vrať tě na login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // načtení dashboard dat
  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const headers = { Authorization: authHeader() };

      const [clientRes, cardsRes, txRes] = await Promise.all([
        fetch("http://localhost:5000/api/client/me", { headers }),
        fetch("http://localhost:5000/api/cards/me", { headers }),
        fetch("http://localhost:5000/api/transactions/me", { headers }),
      ]);

      if (clientRes.status === 401 || cardsRes.status === 401 || txRes.status === 401) {
        setUser(null);
        navigate("/login");
        return;
      }

      const clientData = await clientRes.json();
      const cardsData  = await cardsRes.json();
      const txData     = await txRes.json();

      setClient(clientData);
      setCards(cardsData);
      setTransactions(txData);
    } catch (e) {
      console.error("Chyba při načítání dashboardu:", e);
    }
  }, [user, navigate, setUser, authHeader]);

  useEffect(() => { reload(); }, [reload]);

  // vytvoření nové karty
  async function handleConfirmCreateCard() {
    setCreateError("");
    setMsg(""); setErr("");
    try {
      // Backend očekává lokalizované hodnoty ("debetní" / "kreditní")
      const localized = newCardType === "CREDIT" ? "kreditní" : "debetní";

      const res = await fetch("http://localhost:5000/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(),
        },
        body: JSON.stringify({ cardType: localized }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Nepodařilo se vytvořit kartu");
        return;
      }

      // přidej novou kartu do stavu a zavři modal
      const newCard = {
        id: data.id,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
        endDate: data.endDate,
        balance: data.balance,
        cardType: data.cardType,
      };
      setCards((prev) => [...prev, newCard]);
      setShowCreateCard(false);
      setMsg("Karta byla vytvořena.");
    } catch (e) {
      console.error("Chyba při vytváření karty:", e);
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

  // změny ve formulářích
  const onRepl = (e) => setRepl((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onCc   = (e) => setCc((s)   => ({ ...s, [e.target.name]: e.target.value }));
  const onMob  = (e) => setMob((s)  => ({ ...s, [e.target.name]: e.target.value }));

  // odeslání operací
  async function doPost(path, body, okText) {
    setMsg(""); setErr("");
    try {
      const res = await fetch(`http://localhost:5000/api/cards/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "REQUEST_FAILED");
      }
      setMsg(okText);
      await reload(); // aktualizuj zůstatky a transakce
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submitRepl(e) {
    e.preventDefault();
    if (!repl.card || !repl.amount) return setErr("Vyplň číslo karty a částku.");
    await doPost("replenish", { ...repl, amount: Number(repl.amount) }, "Dobití proběhlo.");
  }

  async function submitCc(e) {
    e.preventDefault();
    if (!cc.fromCard || !cc.toCard || !cc.amount) return setErr("Vyplň karty a částku.");
    await doPost("transfer", { ...cc, amount: Number(cc.amount) }, "Převod proběhl.");
  }

  async function submitMob(e) {
    e.preventDefault();
    if (!mob.fromCard || !mob.phone || !mob.amount) return setErr("Vyplň kartu, telefon a částku.");
    await doPost("mobile", { ...mob, amount: Number(mob.amount) }, "Mobilní převod proběhl.");
  }

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
                <div><strong>Jméno:</strong> {client.fullName || "—"}</div>
                <div><strong>Telefon:</strong> {client.phone || "—"}</div>
                <div><strong>Adresa:</strong> {client.address || "—"}</div>
                <div><strong>Doklad:</strong> {client.passportNumber || "—"}</div>
                <div><strong>Typ klienta:</strong> {client.clientType || "—"}</div>
                <div><strong>Celkem peněz:</strong> {client.totalBalance} UAH</div>
                <div><strong>Login:</strong> {client.login}</div>
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
              <div className="cards-empty">Zatím nemáš žádnou kartu.</div>
            ) : (
              <div className="cards-list">
                {cards.map((card) => (
                  <div key={card.id} className="bank-card">
                    <div className="bank-card-number">{card.cardNumber}</div>

                    <div className="bank-card-row">
                      <div><strong>CVV:</strong> {card.cvv}</div>
                      <div><strong>Platnost:</strong> {card.endDate}</div>
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

          {/* NOVÉ: Operace s kartami */}
          <section className="card card-actions-box">
            <h3 className="section-title">Operace s kartami</h3>

            <div className="card-actions-grid">
              {/* Dobití */}
              <form onSubmit={submitRepl} className="card-action-form">
                <h4>Dobít kartu</h4>
                <input
                  name="card"
                  placeholder="Číslo karty"
                  value={repl.card}
                  onChange={onRepl}
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Částka"
                  value={repl.amount}
                  onChange={onRepl}
                />
                <input
                  name="paymentMethod"
                  placeholder="Metoda (např. CARD)"
                  value={repl.paymentMethod}
                  onChange={onRepl}
                />
                <button className="btn-confirm">Dobít</button>
              </form>

              {/* Karta → karta */}
              <form onSubmit={submitCc} className="card-action-form">
                <h4>Převod karta → karta</h4>
                <input
                  name="fromCard"
                  placeholder="Z karty"
                  value={cc.fromCard}
                  onChange={onCc}
                />
                <input
                  name="toCard"
                  placeholder="Na kartu"
                  value={cc.toCard}
                  onChange={onCc}
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Částka"
                  value={cc.amount}
                  onChange={onCc}
                />
                <input
                  name="description"
                  placeholder="Poznámka"
                  value={cc.description}
                  onChange={onCc}
                />
                <button className="btn-confirm">Převést</button>
              </form>

              {/* Na telefon */}
              <form onSubmit={submitMob} className="card-action-form">
                <h4>Převod na telefon</h4>
                <input
                  name="fromCard"
                  placeholder="Z karty"
                  value={mob.fromCard}
                  onChange={onMob}
                />
                <input
                  name="phone"
                  placeholder="Telefon"
                  value={mob.phone}
                  onChange={onMob}
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="Částka"
                  value={mob.amount}
                  onChange={onMob}
                />
                <button className="btn-confirm">Odeslat</button>
              </form>
            </div>

            {(msg || err) && (
              <div className={`note ${err ? "note-error" : "note-ok"}`}>
                {msg && <div>{msg}</div>}
                {err && <div>{err}</div>}
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
                <div className="transactions-empty">Žádné transakce.</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="transaction-card">
                    <div><strong>Od:</strong> {tx.sender}</div>
                    <div><strong>Komu:</strong> {tx.receiver}</div>
                    <div><strong>Suma:</strong> {tx.amount} ₴</div>
                    <div><strong>Poznámka:</strong> {tx.note || "—"}</div>
                    <div><strong>Datum:</strong> {formatDateTime(tx.transactionDate)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* MODAL */}
      {showCreateCard && (
        <div className="create-card-modal-backdrop" role="dialog" aria-modal="true">
          <div className="create-card-modal">
            <h3 className="modal-title">Vytvořit kartu</h3>

            <label className="modal-label">Typ karty:</label>
            <select
              value={newCardType}
              onChange={(e) => setNewCardType(e.target.value)}
              className="modal-select"
            >
              <option value="DEBIT">DEBIT</option>
              <option value="CREDIT">CREDIT</option>
            </select>

            {createError && (<div className="modal-error">{createError}</div>)}

            <div className="modal-actions">
              <button onClick={() => setShowCreateCard(false)} className="btn-cancel">
                Zrušit
              </button>
              <button onClick={handleConfirmCreateCard} className="btn-confirm">
                Potvrdit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
