// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "../../messages/error.css";
import "../../messages/success.css";
import { api } from "../../lib/api";
import Sidebar from "../../components/sidebar/sidebar";
import { useToast } from "../../ToastContext";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
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

  // ✅ Swiper: index aktuálně zobrazené karty
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // změna loginu/hesla (pro dítě po prvním přihlášení)
  const [credForm, setCredForm] = useState({ newLogin: "", newPassword: "", confirmPassword: "" });
  const [credError, setCredError] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  // ✅ Převod účet → účet (přesunutý do sidebaru)
  const [accTx, setAccTx] = useState({ fromAccount: "", toAccount: "", amount: "", note: "" });

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
      addToast("error", e.response?.data?.error || "Chyba při načítání dat.");
    } finally {
      setLoading(false);
    }
  }, [user, buildAuthHeader, navigate, setUser]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ✅ Pre-fill fromAccount when client data is loaded
  useEffect(() => {
    if (client?.accountNumber) {
      setAccTx((prev) => ({ ...prev, fromAccount: client.accountNumber }));
    }
  }, [client]);

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
    try {
      const headers = buildAuthHeader();
      await api.post(path, body, { headers });
      addToast("success", okText);
      await loadDashboard();
    } catch (e) {
      const message = e.response?.data?.error || e.message || "Chyba požadavku.";
      addToast("error", message);
    }
  }

  // ---------- Karta: vytvoření ----------
  async function handleConfirmCreateCard() {
    if (!user) return;
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
      addToast("success", "Karta byla vytvořena.", "Nyní ji uvidíš v seznamu svých karet.");
    } catch (e) {
      console.error("Chyba při vytváření karty:", e);
      addToast("error", e.response?.data?.error || "Chyba při vytváření karty.");
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
      addToast("error", "Tuto akci může provést pouze plnoletý uživatel.");
      return;
    }

    const errs = validateChildForm();
    setChildErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setChildLoading(true);

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
      addToast("success", "Byl vytvořen účet pro dítě.", "Přístupový kód byl odeslán na zadaný email.");
      loadDashboard();
    } catch (e) {
      console.error("Chyba při vytváření dětského účtu:", e);
      addToast("error", e.response?.data?.error || "Chyba při vytváření dětského účtu.");
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
      return addToast("error", "Vyplň účet odesílatele, účet příjemce a částku.");
    }

    const ACCOUNT_TRANSFER_ENDPOINT = "/transactions/transfer";

    await doPost(
      ACCOUNT_TRANSFER_ENDPOINT,
      { toAccountNumber: accTx.toAccount, amount: Number(accTx.amount), note: accTx.note },
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
                  <div className="client-data-grid">
                    <div className="data-item">
                      <span className="data-label">Jméno</span>
                      <span className="data-value">{client.fullName}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Číslo účtu</span>
                      <span className="data-value primary">{client.accountNumber || "—"}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Datum narození</span>
                      <span className="data-value">
                        {client.birthDate ? new Date(client.birthDate).toLocaleDateString("cs-CZ") : "—"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Adresa</span>
                      <span className="data-value">{client.address || "—"}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Doklad</span>
                      <span className="data-value">{client.passportNumber || "—"}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Typ klienta</span>
                      <span className="data-value pill-value">{client.clientType || "—"}</span>
                    </div>
                    <div className="data-item full-width">
                      <div className="balance-summary">
                        <span className="data-label">Celkový zůstatek</span>
                        <span className="balance-value">{client.totalBalance} Kč</span>
                      </div>
                    </div>
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
                  <div className="cards-swiper">
                    <button
                      type="button"
                      className="swiper-arrow prev"
                      disabled={currentCardIndex === 0}
                      onClick={() => setCurrentCardIndex((p) => p - 1)}
                    >
                      ‹
                    </button>

                    <div className="card-physical-wrapper">
                      {cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className={`card-physical ${card.cardType.toLowerCase().includes("debetní") ? "debit" : "credit"} ${idx === currentCardIndex ? "active" : ""}`}
                          style={{ display: idx === currentCardIndex ? "flex" : "none" }}
                        >
                          <div className="card-inner">
                            <div className="card-top-row">
                              <div className="card-chip">
                                <div className="chip-line"></div>
                                <div className="chip-line"></div>
                                <div className="chip-line"></div>
                              </div>
                              <div className="card-brand">{card.brand}</div>
                            </div>

                            <div className="card-middle-row">
                              <div className="card-number-display">
                                {formatCardNumber(card.cardNumber)}
                              </div>
                            </div>

                            <div className="card-bottom-row">
                              <div className="card-holder-info">
                                <span className="label">CARD HOLDER</span>
                                <span className="value">{client?.fullName?.toUpperCase()}</span>
                              </div>
                              <div className="card-expiry-info">
                                <span className="label">EXPIRES</span>
                                <span className="value">
                                  {card.endDate ? new Date(card.endDate).toLocaleDateString("cs-CZ", { month: "2-digit", year: "2-digit" }) : "—"}
                                </span>
                              </div>
                              <div className="card-cvv-info">
                                <span className="label">CVV</span>
                                <span className="value">***</span>
                              </div>
                            </div>

                            <div className="card-type-label">{card.cardType}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="swiper-arrow next"
                      disabled={currentCardIndex === cards.length - 1}
                      onClick={() => setCurrentCardIndex((p) => p + 1)}
                    >
                      ›
                    </button>
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
                </p>
              </div>

              <form className="transfer-form" onSubmit={submitAccTx}>
                <div className="transfer-grid">
                  <div className="transfer-group">
                    <label className="transfer-label">Z mého účtu</label>
                    <div className="transfer-input-wrapper">
                      <span className="transfer-input-icon">📤</span>
                      <input
                        className="transfer-input"
                        name="fromAccount"
                        value={accTx.fromAccount}
                        readOnly
                        placeholder="Načítám..."
                      />
                    </div>
                  </div>

                  <div className="transfer-group">
                    <label className="transfer-label">Na cílový účet</label>
                    <div className="transfer-input-wrapper">
                      <span className="transfer-input-icon">📥</span>
                      <input
                        className="transfer-input"
                        name="toAccount"
                        value={accTx.toAccount}
                        onChange={onAccTxChange}
                        placeholder="Číslo účtu příjemce"
                      />
                    </div>
                  </div>

                  <div className="transfer-group">
                    <label className="transfer-label">Částka</label>
                    <div className="transfer-input-wrapper">
                      <span className="transfer-input-icon">💰</span>
                      <input
                        className="transfer-input"
                        type="number"
                        step="0.01"
                        name="amount"
                        value={accTx.amount}
                        onChange={onAccTxChange}
                        placeholder="0.00"
                      />
                      <span className="transfer-currency">Kč</span>
                    </div>
                  </div>

                  <div className="transfer-group">
                    <label className="transfer-label">Poznámka (volitelné)</label>
                    <div className="transfer-input-wrapper">
                      <span className="transfer-input-icon">📝</span>
                      <input
                        className="transfer-input"
                        name="note"
                        value={accTx.note}
                        onChange={onAccTxChange}
                        placeholder="např. splátka / nákup"
                      />
                    </div>
                  </div>
                </div>

                <div className="transfer-actions">
                  <button className="transfer-submit-btn" type="submit">
                    Provést platbu <span>→</span>
                  </button>
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
              <p>Vyberte prosím konkrétní položku nastavení v menu.</p>
            </section>
          )}

          {/* NASTAVENÍ: Změna hesla */}
          {activePanel === "settings-password" && (
            <section className="card">
              <h2 className="section-title">Změna hesla</h2>
              <form className="form" onSubmit={async (e) => {
                e.preventDefault();
                const oldPassword = e.target.oldPassword.value;
                const newPassword = e.target.newPassword.value;
                const confirmPassword = e.target.confirmPassword.value;

                if (!oldPassword || !newPassword || !confirmPassword) {
                  return addToast("error", "Vyplňte všechna pole.");
                }
                if (newPassword !== confirmPassword) {
                  return addToast("error", "Nová hesla se neshodují.");
                }
                if (newPassword.length < 6) {
                  return addToast("error", "Nové heslo musí mít alespoň 6 znaků.");
                }

                try {
                  setLoading(true);
                  const headers = buildAuthHeader();
                  await api.post("/auth/change-password", { oldPassword, newPassword }, { headers });
                  addToast("success", "Heslo bylo úspěšně změněno.", "Při příštím přihlášení použijte nové heslo.");
                  e.target.reset();
                } catch (e) {
                  addToast("error", e.response?.data?.error || "Chyba při změně hesla.");
                } finally {
                  setLoading(false);
                }
              }}>
                <label className="field-label">Staré heslo</label>
                <input className="field-input" type="password" name="oldPassword" required />

                <label className="field-label">Nové heslo</label>
                <input className="field-input" type="password" name="newPassword" required />

                <label className="field-label">Potvrzení nového hesla</label>
                <input className="field-input" type="password" name="confirmPassword" required />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Změnit heslo"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* NASTAVENÍ: Změna uživatelského jména */}
          {activePanel === "settings-username" && (
            <section className="card">
              <h2 className="section-title">Změna uživatelského jména</h2>
              <p className="section-hint" style={{ marginBottom: "1rem" }}>
                Uživatelské jméno lze změnit pouze jednou za 30 dní.
              </p>
              <form className="form" onSubmit={async (e) => {
                e.preventDefault();
                const newUsername = e.target.newUsername.value.trim();

                if (!newUsername) return addToast("error", "Zadejte nové uživatelské jméno.");
                if (newUsername === user.login) return addToast("error", "Nové jméno musí být odlišné od stávajícího.");

                try {
                  setLoading(true);
                  const headers = buildAuthHeader();
                  await api.post("/auth/change-username", { newUsername }, { headers });

                  // Aktualizujeme AuthContext s novým loginem, aby seděl Header/Sidebar
                  setUser({ ...user, login: newUsername });
                  addToast("success", "Uživatelské jméno bylo změněno.");
                  e.target.reset();
                } catch (e) {
                  addToast("error", e.response?.data?.error || "Chyba při změně jména.");
                } finally {
                  setLoading(false);
                }
              }}>
                <label className="field-label">Nové uživatelské jméno (login)</label>
                <input className="field-input" type="text" name="newUsername" defaultValue={user.login} required />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Změnit jméno"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* NASTAVENÍ: Změna adresy */}
          {activePanel === "settings-address" && (
            <section className="card">
              <h2 className="section-title">Změna adresy</h2>
              <form className="form" onSubmit={async (e) => {
                e.preventDefault();
                const address = e.target.address.value.trim();

                if (!address) return addToast("error", "Zadejte adresu.");

                try {
                  setLoading(true);
                  const headers = buildAuthHeader();
                  await api.patch("/client/update-info", { address }, { headers });

                  addToast("success", "Adresa byla aktualizována.");
                  await loadDashboard(); // refresh dat o klientovi v UI
                } catch (e) {
                  addToast("error", e.response?.data?.error || "Chyba při aktualizaci adresy.");
                } finally {
                  setLoading(false);
                }
              }}>
                <label className="field-label">Nová adresa</label>
                <input className="field-input" type="text" name="address" defaultValue={client?.address} required />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit adresu"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* NASTAVENÍ: Změna telefonního čísla */}
          {activePanel === "settings-phone" && (
            <section className="card">
              <h2 className="section-title">Změna telefonního čísla</h2>
              <p className="section-hint" style={{ marginBottom: "1rem" }}>
                Telefonní číslo musí začínat <strong>+420</strong> a mít přesně 9 číslic.
                Změnu lze provést pouze jednou za 30 dní.
              </p>
              <form className="form" onSubmit={async (e) => {
                e.preventDefault();
                const phone = e.target.phone.value.trim().replace(/\s+/g, "");

                if (!phone) return addToast("error", "Zadejte telefonní číslo.");

                // Striktní klientská validace (+420 + 9 číslic)
                if (!/^\+420\d{9}$/.test(phone)) {
                  return addToast("error", "Telefonní číslo musí začínat +420 a mít přesně 9 dalších číslic (např. +420123456789).");
                }

                try {
                  setLoading(true);
                  const headers = buildAuthHeader();
                  await api.patch("/client/update-info", { phone }, { headers });

                  addToast("success", "Telefonní číslo bylo aktualizováno.");
                  await loadDashboard();
                } catch (e) {
                  addToast("error", e.response?.data?.error || "Chyba při aktualizaci telefonu.");
                } finally {
                  setLoading(false);
                }
              }}>
                <label className="field-label">Nové telefonní číslo</label>
                <input className="field-input" type="text" name="phone" placeholder="+420123456789" defaultValue={client?.phone} required />

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit telefon"}
                  </button>
                </div>
              </form>
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

    </div>
  );
}
