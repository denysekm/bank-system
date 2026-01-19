// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "../../messages/error.css";
import "../../messages/success.css";
import { api } from "../../lib/api";
import Sidebar from "../../components/sidebar/sidebar";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // ✅ Off-canvas sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("dashboard"); // dashboard | transfers | credits | settings

  const [client, setClient] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [childrenAccounts, setChildrenAccounts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState("debetní");
  const [newCardBrand, setNewCardBrand] = useState("VISA");

  const [showChildModal, setShowChildModal] = useState(false);
  const [childForm, setChildForm] = useState({ fullName: "", birthNumber: "", email: "" });
  const [childErrors, setChildErrors] = useState({});
  const [childLoading, setChildLoading] = useState(false);

  // změna loginu/hesla (pro dítě po prvním přihlášení)
  const [credForm, setCredForm] = useState({ newLogin: "", newPassword: "", confirmPassword: "" });
  const [credError, setCredError] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  // ✅ Převod účet → účet (přesunutý do sidebaru)
  const [accTx, setAccTx] = useState({ fromAccount: "", toAccount: "", amount: "", note: "" });

  // ✅ Full-screen overlay message
  const [overlayMsg, setOverlayMsg] = useState(null); // { type: 'success' | 'error', text: '', hint: '' }

  const buildAuthHeader = useCallback(() => {
    if (!user) return {};
    const raw = `${user.login}:${user.password}`;
    const safe = btoa(unescape(encodeURIComponent(raw)));
    return { Authorization: `Basic ${safe}` };
  }, [user]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // ✅ zavření sidebaru přes ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setOverlayMsg(null);
    try {
      const headers = buildAuthHeader();

      const [clientRes, cardsRes, txRes, childrenRes] = await Promise.all([
        api.get("/client/me", { headers }),
        api.get("/cards/me", { headers }),
        api.get("/transactions/me", { headers }),
        api.get("/client/children", { headers }).catch(() => ({ data: [] })),
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
      setOverlayMsg({ type: "error", text: e.response?.data?.error || "Chyba při načítání dat." });
    } finally {
      setLoading(false);
    }
  }, [user, buildAuthHeader, navigate, setUser]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ---------- helpers ----------
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
    return String(cardNumber).replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
  }

  // ✅ spočti věk z birthDate (spolehlivé, nezávislé na backend isMinor)
  function getAge(birthDate) {
    if (!birthDate) return null;
    const b = new Date(birthDate);
    if (Number.isNaN(b.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }

  const age = getAge(client?.birthDate);
  const canCreateChildAccount = age !== null && age >= 18;

  // univerzální POST s přihlášením (použijeme i pro převod účet→účet)
  async function doPost(path, body, okText) {
    setOverlayMsg(null);
    try {
      const headers = buildAuthHeader();
      await api.post(path, body, { headers });
      setOverlayMsg({ type: "success", text: okText });
      await loadDashboard();
    } catch (e) {
      const message = e.response?.data?.error || e.message || "Chyba požadavku.";
      setOverlayMsg({ type: "error", text: message });
    }
  }

  // ---------- Karta: vytvoření ----------
  async function handleConfirmCreateCard() {
    if (!user) return;
    setOverlayMsg(null);
    try {
      const headers = buildAuthHeader();
      const res = await api.post("/cards", { cardType: newCardType, brand: newCardBrand }, { headers });

      const data = res.data;
      setCards((prev) => [
        ...prev,
        {
          id: data.id,
          cardNumber: data.cardNumber,
          cvv: data.cvv,
          endDate: data.endDate,
          balance: data.balance,
          cardType: data.cardType,
          brand: data.brand,
        },
      ]);

      setShowCreateCard(false);
      setOverlayMsg({ type: "success", text: "Karta byla vytvořena.", hint: "Nyní ji uvidíš v seznamu svých karet." });
    } catch (e) {
      console.error("Chyba při vytváření karty:", e);
      setOverlayMsg({ type: "error", text: e.response?.data?.error || "Chyba při vytváření karty." });
    }
  }

  // ---------- Dětský účet ----------
  function validateChildForm() {
    const errs = {};
    if (!childForm.fullName.trim()) errs.fullName = "Zadej jméno a příjmení.";
    if (!childForm.birthNumber.trim()) errs.birthNumber = "Zadej rodné číslo.";
    if (!childForm.email.trim()) errs.email = "Zadej email dítěte.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childForm.email)) errs.email = "Zadej platný email.";
    return errs;
  }

  const handleChildInputChange = (e) => {
    const { name, value } = e.target;
    setChildForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleChildInviteSubmit(e) {
    e.preventDefault();
    if (!user) return;

    // ✅ guard: jen plnoletý
    if (!canCreateChildAccount) {
      setOverlayMsg({ type: "error", text: "Tuto akci může provést pouze plnoletý uživatel." });
      return;
    }

    const errs = validateChildForm();
    setChildErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setChildLoading(true);
    setOverlayMsg(null);

    try {
      const headers = buildAuthHeader();
      await api.post(
        "/client/children/invite",
        { fullName: childForm.fullName, birthNumber: childForm.birthNumber, email: childForm.email },
        { headers }
      );

      setShowChildModal(false);
      setChildForm({ fullName: "", birthNumber: "", email: "" });
      setChildErrors({});
      setOverlayMsg({
        type: "success",
        text: "Byl vytvořen účet pro dítě.",
        hint: "Přístupový kód byl odeslán na zadaný email."
      });
      loadDashboard();
    } catch (e) {
      console.error("Chyba při vytváření dětského účtu:", e);
      setOverlayMsg({ type: "error", text: e.response?.data?.error || "Chyba při vytváření dětského účtu." });
    } finally {
      setChildLoading(false);
    }
  }

  // ---------- Změna přihlašovacích údajů ----------
  const handleCredInputChange = (e) => {
    const { name, value } = e.target;
    setCredForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleCredSubmit(e) {
    e.preventDefault();
    setOverlayMsg(null);

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
        { newLogin: credForm.newLogin, newPassword: credForm.newPassword },
        { headers }
      );
      setUser(null);
      navigate("/login");
    } catch (e) {
      console.error("Chyba při změně přihlašovacích údajů:", e);
      setCredError(e.response?.data?.error || "Chyba při změně přihlašovacích údajů.");
    } finally {
      setCredLoading(false);
    }
  }

  // ---------- ✅ převod účet → účet ----------
  const onAccTxChange = (e) => {
    const { name, value } = e.target;
    setAccTx((prev) => ({ ...prev, [name]: value }));
  };

  async function submitAccTx(e) {
    e.preventDefault();
    if (!accTx.fromAccount || !accTx.toAccount || !accTx.amount) {
      return setOverlayMsg({ type: "error", text: "Vyplň účet odesílatele, účet příjemce a částku." });
    }

    const ACCOUNT_TRANSFER_ENDPOINT = "/accounts/transfer";

    await doPost(
      ACCOUNT_TRANSFER_ENDPOINT,
      { ...accTx, amount: Number(accTx.amount) },
      "Převod mezi účty proběhl."
    );
  }

  if (!user) return null;

  const mustChange = client?.mustChangeCredentials;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Otevřít menu"
          >
            ☰
          </button>

          <div>
            <h1 className="dashboard-title">Můj dashboard</h1>
            {client && (
              <p className="dashboard-subtitle">
                Vítej, <strong>{client.fullName}</strong>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* ✅ Off-canvas Sidebar */}
      <Sidebar
        open={sidebarOpen}
        active={activePanel}
        onSelect={setActivePanel}
        onClose={() => setSidebarOpen(false)}
      />



      {loading ? (
        <div className="dashboard-loading">Načítání dat...</div>
      ) : (
        <>
          {/* DASHBOARD GRID (bez převodů) */}
          {activePanel === "dashboard" && (
            <div className="dashboard-grid">
              {mustChange && (
                <section className="card warning-card">
                  <h2 className="section-title">⚠ Musíš změnit přihlašovací údaje</h2>
                  <p className="warning-text">
                    Přihlásil/a ses pomocí dočasného kódu. Pro další používání účtu si nastav vlastní login a heslo.
                  </p>

                  <form onSubmit={handleCredSubmit} className="form">
                    <label className="field-label">Nový login</label>
                    <input
                      className="field-input"
                      type="text"
                      name="newLogin"
                      value={credForm.newLogin}
                      onChange={handleCredInputChange}
                    />

                    <label className="field-label">Nové heslo</label>
                    <input
                      className="field-input"
                      type="password"
                      name="newPassword"
                      value={credForm.newPassword}
                      onChange={handleCredInputChange}
                    />

                    <label className="field-label">Potvrzení hesla</label>
                    <input
                      className="field-input"
                      type="password"
                      name="confirmPassword"
                      value={credForm.confirmPassword}
                      onChange={handleCredInputChange}
                    />

                    {credError && <div className="inline-error">{credError}</div>}

                    <div className="form-actions">
                      <button className="btn btn-primary" type="submit" disabled={credLoading}>
                        {credLoading ? "Ukládám..." : "Uložit a odhlásit"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section className="card client-card">
                <h2 className="section-title">Údaje o klientovi</h2>
                {client ? (
                  <div className="client-info">
                    <div><strong>Jméno:</strong> {client.fullName}</div>
                    <div>
                      <strong>Datum narození:</strong>{" "}
                      {client.birthDate ? new Date(client.birthDate).toLocaleDateString("cs-CZ") : "—"}
                    </div>
                    <div><strong>Adresa:</strong> {client.address || "—"}</div>
                    <div><strong>Doklad:</strong> {client.passportNumber || "—"}</div>
                    <div><strong>Typ klienta:</strong> {client.clientType || "—"}</div>
                    <div><strong>Celkem peněz:</strong> {client.totalBalance} Kč</div>
                    <div><strong>Login:</strong> {client.login}</div>
                  </div>
                ) : (
                  <p>Data o klientovi se nepodařilo načíst.</p>
                )}
              </section>

              <section className="cards-box card">
                <div className="cards-header">
                  <h2 className="section-title no-margin">Moje karty</h2>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setNewCardType("debetní");
                      setNewCardBrand("VISA");
                      setShowCreateCard(true);
                    }}
                  >
                    Vytvořit kartu
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="empty">Zatím nemáš žádnou kartu.</div>
                ) : (
                  <div className="cards-list">
                    {cards.map((card) => (
                      <div key={card.id} className="card-item">
                        <div className="card-top">
                          <div className="card-number">{formatCardNumber(card.cardNumber)}</div>
                          <div className="pill">{card.cardType} · {card.brand}</div>
                        </div>
                        <div className="card-meta">
                          <div><span>CVV:</span> <strong>{card.cvv}</strong></div>
                          <div>
                            <span>Platnost do:</span>{" "}
                            <strong>{card.endDate ? new Date(card.endDate).toLocaleDateString("cs-CZ") : "—"}</strong>
                          </div>
                          <div><span>Zůstatek:</span> <strong>{card.balance} Kč</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ✅ DĚTSKÉ ÚČTY: jen pro plnoleté */}
              {canCreateChildAccount && (
                <section className="card children-card">
                  <div className="children-header">
                    <h2 className="section-title">Dětské účty</h2>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setChildErrors({});
                        setChildForm({ fullName: "", birthNumber: "", email: "" });
                        setShowChildModal(true);
                      }}
                    >
                      Vytvořit účet pro neplnoletého
                    </button>
                  </div>

                  {childrenAccounts.length === 0 ? (
                    <div className="empty">Nemáš zatím žádné dětské účty.</div>
                  ) : (
                    <div className="children-list">
                      {childrenAccounts.map((ch) => (
                        <div key={ch.BankAccountID || ch.ClientID} className="child-item">
                          <div className="child-top">
                            <strong>{ch.FullName || ch.fullName}</strong>
                          </div>
                          <div className="child-row">
                            <span>ID účtu:</span> <strong>{ch.BankAccountID || ch.bankAccountId}</strong>
                          </div>
                          <div className="child-row">
                            <span>Datum narození:</span>{" "}
                            <strong>{ch.BirthDate ? new Date(ch.BirthDate).toLocaleDateString("cs-CZ") : "—"}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="card transactions-card">
                <h2 className="section-title">Poslední transakce</h2>
                {transactions.length === 0 ? (
                  <div className="empty">Žádné transakce k zobrazení.</div>
                ) : (
                  <div className="transactions-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div><span>Od:</span> <strong>{tx.sender}</strong></div>
                        <div><span>Komu:</span> <strong>{tx.receiver}</strong></div>
                        <div><span>Částka:</span> <strong>{tx.amount} Kč</strong></div>
                        <div><span>Poznámka:</span> <strong>{tx.note || "—"}</strong></div>
                        <div><span>Datum:</span> <strong>{formatDateTime(tx.transactionDate)}</strong></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* PŘEVODY PANEL */}
          {activePanel === "transfers" && (
            <section className="card transfer-card">
              <div className="section-head">
                <h2 className="section-title">Převod mezi účty</h2>
                <p className="section-hint">
                  Zadej účet odesílatele, příjemce a částku (podle toho, co tvůj backend očekává – ID nebo číslo účtu).
                </p>
              </div>

              <form className="form" onSubmit={submitAccTx}>
                <label className="field-label">Z účtu</label>
                <input
                  className="field-input"
                  name="fromAccount"
                  value={accTx.fromAccount}
                  onChange={onAccTxChange}
                  placeholder="ID nebo číslo účtu"
                />

                <label className="field-label">Na účet</label>
                <input
                  className="field-input"
                  name="toAccount"
                  value={accTx.toAccount}
                  onChange={onAccTxChange}
                  placeholder="ID nebo číslo účtu"
                />

                <label className="field-label">Částka</label>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  name="amount"
                  value={accTx.amount}
                  onChange={onAccTxChange}
                  placeholder="0.00"
                />

                <label className="field-label">Poznámka (volitelné)</label>
                <input
                  className="field-input"
                  name="note"
                  value={accTx.note}
                  onChange={onAccTxChange}
                  placeholder="např. splátka / nákup"
                />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">Převést</button>
                </div>
              </form>
            </section>
          )}

          {/* Placeholdery */}
          {activePanel === "credits" && (
            <section className="card">
              <h2 className="section-title">Credits</h2>
              <p>Zatím není hotovo.</p>
            </section>
          )}

          {activePanel === "settings" && (
            <section className="card">
              <h2 className="section-title">Settings</h2>
              <p>Zatím není hotovo.</p>
            </section>
          )}
        </>
      )}

      {/* MODAL – VYTVOŘENÍ KARTY */}
      {/* MODAL – VYTVOŘENÍ KARTY */}
      {showCreateCard && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 className="modal-title">Vytvořit kartu</h3>

            <label className="field-label">Typ karty</label>
            <select className="field-select" value={newCardType} onChange={(e) => setNewCardType(e.target.value)}>
              <option value="debetní">debetní</option>
              <option value="kreditní">kreditní</option>
            </select>

            <label className="field-label">Značka karty</label>
            <select className="field-select" value={newCardBrand} onChange={(e) => setNewCardBrand(e.target.value)}>
              <option value="VISA">VISA</option>
              <option value="MASTERCARD">MASTERCARD</option>
            </select>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreateCard(false)}>Zrušit</button>
              <button className="btn btn-primary" onClick={handleConfirmCreateCard}>Potvrdit</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL – VYTVOŘENÍ ÚČTU PRO NEPLNOLETÉHO */}
      {canCreateChildAccount && showChildModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 className="modal-title">Vytvořit účet pro neplnoletého</h3>

            <form onSubmit={handleChildInviteSubmit} className="form">
              <label className="field-label">Jméno a příjmení</label>
              <input
                className="field-input"
                type="text"
                name="fullName"
                value={childForm.fullName}
                onChange={handleChildInputChange}
              />
              {childErrors.fullName && <div className="inline-error">{childErrors.fullName}</div>}

              <label className="field-label">Rodné číslo</label>
              <input
                className="field-input"
                type="text"
                name="birthNumber"
                value={childForm.birthNumber}
                onChange={handleChildInputChange}
                placeholder="RRMMDD/XXXX"
              />
              {childErrors.birthNumber && <div className="inline-error">{childErrors.birthNumber}</div>}

              <label className="field-label">Email dítěte</label>
              <input
                className="field-input"
                type="email"
                name="email"
                value={childForm.email}
                onChange={handleChildInputChange}
              />
              {childErrors.email && <div className="inline-error">{childErrors.email}</div>}

              <div className="modal-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  disabled={childLoading}
                >
                  Zrušit
                </button>
                <button className="btn btn-primary" type="submit" disabled={childLoading}>
                  {childLoading ? "Odesílám..." : "Vytvořit účet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZPRÁVA NA CELOU OBRAZOVKU */}
      {overlayMsg && (
        <div
          className={`message-overlay ${overlayMsg.type}`}
          onClick={() => setOverlayMsg(null)}
        >
          {overlayMsg.type === "success" ? (
            <div className="success-box" onClick={(e) => e.stopPropagation()}>
              <div className="checkmark">✔</div>
              <div className="message">{overlayMsg.text}</div>
              {overlayMsg.hint && <div className="hint">{overlayMsg.hint}</div>}
            </div>
          ) : (
            <div className="error-box" onClick={(e) => e.stopPropagation()}>
              <div className="crossmark">✖</div>
              <div className="message">{overlayMsg.text}</div>
              {overlayMsg.hint && <div className="hint">{overlayMsg.hint}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
