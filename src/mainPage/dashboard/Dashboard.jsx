import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../../lib/api";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [childrenAccounts, setChildrenAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState("debetní");
  const [newCardBrand, setNewCardBrand] = useState("VISA");
  const [createCardError, setCreateCardError] = useState("");

  const [showChildModal, setShowChildModal] = useState(false);
  const [childForm, setChildForm] = useState({
    fullName: "",
    birthNumber: "",
    email: "",
  });
  const [childErrors, setChildErrors] = useState({});
  const [childLoading, setChildLoading] = useState(false);

  // změna loginu/hesla (pro dítě po prvním přihlášení)
  const [credForm, setCredForm] = useState({
    newLogin: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [credError, setCredError] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  const buildAuthHeader = useCallback(() => {
    if (!user) return {};
    const raw = `${user.login}:${user.password}`;
    const safe = btoa(unescape(encodeURIComponent(raw)));
    return { Authorization: `Basic ${safe}` };
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setGlobalError("");
    try {
      const headers = buildAuthHeader();

      const [clientRes, cardsRes, txRes, childrenRes] = await Promise.all([
        api.get("/client/me", { headers }),
        api.get("/cards/me", { headers }),
        api.get("/transactions/me", { headers }),
        api
          .get("/client/children", { headers })
          .catch(() => ({ data: [] })),
      ]);

      setClient(clientRes.data || null);
      setCards(cardsRes.data || []);
      setTransactions(txRes.data || []);
      setChildrenAccounts(childrenRes.data || []);
    } catch (e) {
      console.error("Chyba při načítání dashboardu:", e);
      if (e.response && e.response.status === 401) {
        setUser(null);
        navigate("/login");
        return;
      }
      const msg = e.response?.data?.error || "Chyba při načítání dat.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, buildAuthHeader, navigate, setUser]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  function formatCardNumber(cardNumber) {
    if (!cardNumber) return "";
    return String(cardNumber)
      .replace(/\s+/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  async function handleConfirmCreateCard() {
    if (!user) return;
    setCreateCardError("");
    try {
      const headers = buildAuthHeader();

      const res = await api.post(
        "/cards",
        {
          cardType: newCardType,
          brand: newCardBrand,
        },
        { headers }
      );

      const data = res.data;

      const newCard = {
        id: data.id,
        cardNumber: data.cardNumber,
        cvv: data.cvv,
        endDate: data.endDate,
        balance: data.balance,
        cardType: data.cardType,
        brand: data.brand,
      };

      setCards((prev) => [...prev, newCard]);
      setShowCreateCard(false);
      setInfoMsg("Karta byla vytvořena.");
    } catch (e) {
      console.error("Chyba při vytváření karty:", e);
      const message =
        e.response?.data?.error || "Chyba při vytváření karty.";
      setCreateCardError(message);
    }
  }

  function validateChildForm() {
    const errs = {};
    if (!childForm.fullName.trim()) {
      errs.fullName = "Zadej jméno a příjmení.";
    }
    if (!childForm.birthNumber.trim()) {
      errs.birthNumber = "Zadej rodné číslo.";
    }
    if (!childForm.email.trim()) {
      errs.email = "Zadej email dítěte.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childForm.email)) {
      errs.email = "Zadej platný email.";
    }
    return errs;
  }

  const handleChildInputChange = (e) => {
    const { name, value } = e.target;
    setChildForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleChildInviteSubmit(e) {
    e.preventDefault();
    if (!user) return;

    const errs = validateChildForm();
    setChildErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setChildLoading(true);
    setGlobalError("");
    setInfoMsg("");

    try {
      const headers = buildAuthHeader();
      await api.post(
        "/client/children/invite",
        {
          fullName: childForm.fullName,
          birthNumber: childForm.birthNumber,
          email: childForm.email,
        },
        { headers }
      );

      setShowChildModal(false);
      setChildForm({ fullName: "", birthNumber: "", email: "" });
      setChildErrors({});
      setInfoMsg(
        "Byl vytvořen účet pro dítě. Přístupový kód byl odeslán na zadaný email."
      );

      loadDashboard();
    } catch (e) {
      console.error("Chyba při vytváření dětského účtu:", e);
      const msg =
        e.response?.data?.error || "Chyba při vytváření dětského účtu.";
      setGlobalError(msg);
    } finally {
      setChildLoading(false);
    }
  }

  // změna loginu/hesla (pro dítě)
  const handleCredInputChange = (e) => {
    const { name, value } = e.target;
    setCredForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleCredSubmit(e) {
    e.preventDefault();
    setCredError("");
    setInfoMsg("");

    if (!credForm.newLogin || !credForm.newPassword) {
      setCredError("Vyplň nový login i heslo.");
      return;
    }
    if (credForm.newPassword !== credForm.confirmPassword) {
      setCredError("Hesla se neshodují.");
      return;
    }

    try {
      setCredLoading(true);
      const headers = buildAuthHeader();
      await api.post(
        "/auth/change-credentials",
        {
          newLogin: credForm.newLogin,
          newPassword: credForm.newPassword,
        },
        { headers }
      );

      // stará data jsou přepsaná, MustChangeCredentials = 0
      // odhlásíme uživatele a pošleme ho na login
      setUser(null);
      navigate("/login");
    } catch (e) {
      console.error("Chyba při změně přihlašovacích údajů:", e);
      const msg =
        e.response?.data?.error ||
        "Chyba při změně přihlašovacích údajů.";
      setCredError(msg);
    } finally {
      setCredLoading(false);
    }
  }

  if (!user) {
    return null;
  }

  const mustChange = client?.mustChangeCredentials;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Můj dashboard</h1>
          {client && (
            <p className="dashboard-subtitle">
              Vítej, <strong>{client.fullName}</strong>
            </p>
          )}
        </div>
      </header>

      {globalError && <div className="alert alert-error">{globalError}</div>}
      {infoMsg && <div className="alert alert-success">{infoMsg}</div>}
      {createCardError && (
        <div className="alert alert-error">{createCardError}</div>
      )}

      {loading ? (
        <div className="dashboard-loading">Načítání dat...</div>
      ) : (
        <div className="dashboard-grid">
          {/* Pokud musí změnit login/heslo – červené upozornění + formulář */}
          {mustChange && (
            <section className="card warning-card">
              <h2 className="section-title">
                ⚠ Musíš změnit přihlašovací údaje
              </h2>
              <p className="warning-text">
                Přihlásil/a ses pomocí dočasného kódu. Pro další používání
                účtu si nastav vlastní login a heslo.
              </p>

              <form onSubmit={handleCredSubmit} className="cred-form">
                <label className="modal-label">Nový login:</label>
                <input
                  type="text"
                  name="newLogin"
                  value={credForm.newLogin}
                  onChange={handleCredInputChange}
                  className="modal-input"
                />

                <label className="modal-label">Nové heslo:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={credForm.newPassword}
                  onChange={handleCredInputChange}
                  className="modal-input"
                />

                <label className="modal-label">Potvrzení hesla:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={credForm.confirmPassword}
                  onChange={handleCredInputChange}
                  className="modal-input"
                />

                {credError && (
                  <div className="modal-error">{credError}</div>
                )}

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="btn-confirm"
                    disabled={credLoading}
                  >
                    {credLoading
                      ? "Ukládám..."
                      : "Uložit a odhlásit"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Údaje o klientovi */}
          <section className="card client-card">
            <h2 className="section-title">Údaje o klientovi</h2>
            {client ? (
              <div className="client-info">
                <div>
                  <strong>Jméno:</strong> {client.fullName}
                </div>
                <div>
                  <strong>Datum narození:</strong>{" "}
                  {client.birthDate
                    ? new Date(client.birthDate).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>
                <div>
                  <strong>Adresa:</strong> {client.address || "—"}
                </div>
                <div>
                  <strong>Doklad:</strong>{" "}
                  {client.passportNumber || "—"}
                </div>
                <div>
                  <strong>Typ klienta:</strong>{" "}
                  {client.clientType || "—"}
                </div>
                <div>
                  <strong>Celkem peněz:</strong>{" "}
                  {client.totalBalance} Kč
                </div>
                <div>
                  <strong>Login:</strong> {client.login}
                </div>
              </div>
            ) : (
              <p>Data o klientovi se nepodařilo načíst.</p>
            )}
          </section>

          {/* Moje karty */}
          <section className="cards-box card">
            <div className="cards-header">
              <h2 className="section-title no-margin">Moje karty</h2>
              <button
                type="button"
                onClick={() => {
                  setCreateCardError("");
                  setNewCardType("debetní");
                  setNewCardBrand("VISA");
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
                  <div key={card.id} className="card-item">
                    <div className="card-number">
                      {formatCardNumber(card.cardNumber)}
                    </div>
                    <div className="card-row">
                      <span>Typ:</span> <strong>{card.cardType}</strong>
                    </div>
                    <div className="card-row">
                      <span>Značka:</span>{" "}
                      <strong>{card.brand}</strong>
                    </div>
                    <div className="card-row">
                      <span>CVV:</span> <strong>{card.cvv}</strong>
                    </div>
                    <div className="card-row">
                      <span>Platnost do:</span>{" "}
                      <strong>
                        {card.endDate
                          ? new Date(card.endDate).toLocaleDateString(
                              "cs-CZ"
                            )
                          : "—"}
                      </strong>
                    </div>
                    <div className="card-row">
                      <span>Zůstatek:</span>{" "}
                      <strong>{card.balance} Kč</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Dětské účty rodiče */}
          <section className="card children-card">
            <div className="children-header">
              <h2 className="section-title">Dětské účty</h2>
              <button
                type="button"
                className="create-child-btn"
                onClick={() => {
                  setChildErrors({});
                  setChildForm({
                    fullName: "",
                    birthNumber: "",
                    email: "",
                  });
                  setShowChildModal(true);
                }}
              >
                Vytvořit účet pro neplnoletého
              </button>
            </div>

            {childrenAccounts.length === 0 ? (
              <p>Nemáš zatím žádné dětské účty.</p>
            ) : (
              <div className="children-list">
                {childrenAccounts.map((ch) => (
                  <div
                    key={ch.BankAccountID || ch.ClientID}
                    className="child-item"
                  >
                    <div>
                      <strong>{ch.FullName || ch.fullName}</strong>
                    </div>
                    <div>
                      <span>ID účtu:</span>{" "}
                      <strong>
                        {ch.BankAccountID || ch.bankAccountId}
                      </strong>
                    </div>
                    <div>
                      <span>Datum narození:</span>{" "}
                      <strong>
                        {ch.BirthDate
                          ? new Date(ch.BirthDate).toLocaleDateString(
                              "cs-CZ"
                            )
                          : "—"}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Poslední transakce */}
          <section className="card transactions-card">
            <h2 className="section-title">Poslední transakce</h2>
            {transactions.length === 0 ? (
              <p>Žádné transakce k zobrazení.</p>
            ) : (
              <div className="transactions-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div>
                      <strong>Od:</strong> {tx.sender}
                    </div>
                    <div>
                      <strong>Komu:</strong> {tx.receiver}
                    </div>
                    <div>
                      <strong>Částka:</strong> {tx.amount} Kč
                    </div>
                    <div>
                      <strong>Poznámka:</strong>{" "}
                      {tx.note || "—"}
                    </div>
                    <div>
                      <strong>Datum:</strong>{" "}
                      {formatDateTime(tx.transactionDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODAL – VYTVOŘENÍ KARTY */}
      {showCreateCard && (
        <div
          className="create-card-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="create-card-modal">
            <h3 className="modal-title">Vytvořit kartu</h3>

            <label className="modal-label">Typ karty:</label>
            <select
              value={newCardType}
              onChange={(e) => setNewCardType(e.target.value)}
              className="modal-select"
            >
              <option value="debetní">debetní</option>
              <option value="kreditní">kreditní</option>
            </select>

            <label className="modal-label">Značka karty:</label>
            <select
              value={newCardBrand}
              onChange={(e) => setNewCardBrand(e.target.value)}
              className="modal-select"
            >
              <option value="VISA">VISA</option>
              <option value="MASTERCARD">MASTERCARD</option>
            </select>

            {createCardError && (
              <div className="modal-error">{createCardError}</div>
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

      {/* MODAL – VYTVOŘENÍ ÚČTU PRO NEPLNOLETÉHO */}
      {showChildModal && (
        <div
          className="create-card-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="create-card-modal">
            <h3 className="modal-title">
              Vytvořit účet pro neplnoletého
            </h3>

            <form onSubmit={handleChildInviteSubmit}>
              <label className="modal-label">Jméno a příjmení:</label>
              <input
                type="text"
                name="fullName"
                value={childForm.fullName}
                onChange={handleChildInputChange}
                className="modal-input"
              />
              {childErrors.fullName && (
                <div className="modal-error">
                  {childErrors.fullName}
                </div>
              )}

              <label className="modal-label">Rodné číslo:</label>
              <input
                type="text"
                name="birthNumber"
                value={childForm.birthNumber}
                onChange={handleChildInputChange}
                className="modal-input"
                placeholder="RRMMDD/XXXX"
              />
              {childErrors.birthNumber && (
                <div className="modal-error">
                  {childErrors.birthNumber}
                </div>
              )}

              <label className="modal-label">Email dítěte:</label>
              <input
                type="email"
                name="email"
                value={childForm.email}
                onChange={handleChildInputChange}
                className="modal-input"
              />
              {childErrors.email && (
                <div className="modal-error">
                  {childErrors.email}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="btn-cancel"
                  disabled={childLoading}
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={childLoading}
                >
                  {childLoading ? "Odesílám..." : "Vytvořit účet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
