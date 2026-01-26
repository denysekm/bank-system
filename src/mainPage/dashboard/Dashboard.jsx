// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "../../messages/error.css";
import "../../messages/success.css";
import { api } from "../../lib/api";
import Sidebar from "./components/Sidebar/sidebar";
import { useToast } from "../../context/ToastContext";

// Importované sub-komponenty
import ClientInfo from "./components/ClientInfo";
import CardManager from "./components/CardManager";
import TransactionHistory from "./components/TransactionHistory";
import ChildAccounts from "./components/ChildAccounts";
import TransferForm from "./components/TransferForm";
import { PasswordForm, UsernameForm, AddressForm, PhoneForm } from "./components/Settings/SettingsForms";
import CreateCardModal from "./components/Modals/CreateCardModal";
import ChildInviteModal from "./components/Modals/ChildInviteModal";

/**
 * Hlavní Dashboard aplikace.
 * Tato komponenta nyní slouží především jako orchestrátor stavu a logiky,
 * zatímco samotné zobrazení je rozděleno do menších komponent.
 */
export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // ✅ Stavy pro navigaci a sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("dashboard"); // dashboard | transfers | settings-*

  // ✅ Data z API
  const [client, setClient] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [childrenAccounts, setChildrenAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Stavy pro modální okna a formuláře
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState("debetní");
  const [newCardBrand, setNewCardBrand] = useState("VISA");

  const [showChildModal, setShowChildModal] = useState(false);
  const [childForm, setChildForm] = useState({ fullName: "", birthNumber: "", email: "" });
  const [childErrors, setChildErrors] = useState({});
  const [childLoading, setChildLoading] = useState(false);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Stavy pro "Must Change Credentials" (dočasný kód)
  const [credForm, setCredForm] = useState({ newLogin: "", newPassword: "", confirmPassword: "" });
  const [credError, setCredError] = useState("");
  const [credLoading, setCredLoading] = useState(false);

  // Stav pro bankovní převod
  const [accTx, setAccTx] = useState({ fromAccount: "", toAccount: "", amount: "", note: "" });

  // ---------- Pomocné funkce ----------

  const buildAuthHeader = useCallback(() => {
    if (!user) return {};
    const raw = `${user.login}:${user.password}`;
    const safe = btoa(unescape(encodeURIComponent(raw)));
    return { Authorization: `Basic ${safe}` };
  }, [user]);

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
      if (e.response?.status === 401) {
        setUser(null);
        navigate("/login");
        return;
      }
      addToast("error", e.response?.data?.error || "Chyba při načítání dat.");
    } finally {
      setLoading(false);
    }
  }, [user, buildAuthHeader, navigate, setUser, addToast]);

  const doPost = async (path, body, okText) => {
    try {
      const headers = buildAuthHeader();
      await api.post(path, body, { headers });
      addToast("success", okText);
      await loadDashboard();
    } catch (e) {
      addToast("error", e.response?.data?.error || e.message || "Chyba požadavku.");
    }
  };

  // ---------- Efekty ----------

  useEffect(() => {
    if (!user) navigate("/login");
    else loadDashboard();
  }, [user, navigate, loadDashboard]);

  useEffect(() => {
    if (client?.accountNumber) {
      setAccTx((prev) => ({ ...prev, fromAccount: client.accountNumber }));
    }
  }, [client]);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---------- Handlery ----------

  const formatDateTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatCardNumber = (num) => {
    if (!num) return "";
    return String(num).replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
  };

  const age = (() => {
    if (!client?.birthDate) return null;
    const b = new Date(client.birthDate);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    if (now.getMonth() - b.getMonth() < 0 || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
    return a;
  })();

  const canCreateChildAccount = age !== null && age >= 18;

  async function handleConfirmCreateCard() {
    try {
      const headers = buildAuthHeader();
      await api.post("/cards", { cardType: newCardType, brand: newCardBrand }, { headers });
      setShowCreateCard(false);
      addToast("success", "Karta byla vytvořena.");
      loadDashboard();
    } catch (e) {
      addToast("error", e.response?.data?.error || "Chyba při vytváření karty.");
    }
  }

  async function handleChildInviteSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!childForm.fullName.trim()) errs.fullName = "Zadej jméno a příjmení.";
    if (!childForm.birthNumber.trim()) errs.birthNumber = "Zadej rodné číslo.";
    if (!childForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childForm.email)) errs.email = "Zadej platný email.";
    setChildErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setChildLoading(true);
    try {
      const headers = buildAuthHeader();
      await api.post("/client/children/invite", childForm, { headers });
      setShowChildModal(false);
      setChildForm({ fullName: "", birthNumber: "", email: "" });
      addToast("success", "Účet pro dítě vytvořen.");
      loadDashboard();
    } catch (e) {
      addToast("error", e.response?.data?.error || "Chyba při vytváření účtu.");
    } finally {
      setChildLoading(false);
    }
  }

  async function handleCredSubmit(e) {
    e.preventDefault();
    if (!credForm.newLogin || !credForm.newPassword) return setCredError("Vyplň login i heslo.");
    if (credForm.newPassword !== credForm.confirmPassword) return setCredError("Hesla se neshodují.");
    try {
      setCredLoading(true);
      const headers = buildAuthHeader();
      await api.post("/auth/change-credentials", { newLogin: credForm.newLogin, newPassword: credForm.newPassword }, { headers });
      setUser(null);
      navigate("/login");
    } catch (e) {
      setCredError(e.response?.data?.error || "Chyba při změně údajů.");
    } finally {
      setCredLoading(false);
    }
  }

  const submitAccTx = (e) => {
    e.preventDefault();
    if (!accTx.toAccount || !accTx.amount) return addToast("error", "Vyplňte všechna pole.");
    doPost("/transactions/transfer", { toAccountNumber: accTx.toAccount, amount: Number(accTx.amount), note: accTx.note }, "Převod proběhl.");
  };

  // Handlery pro Nastavení
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = e.target;
    if (newPassword.value !== confirmPassword.value) return addToast("error", "Hesla se neshodují.");
    try {
      setLoading(true);
      await api.post("/auth/change-password", { oldPassword: oldPassword.value, newPassword: newPassword.value }, { headers: buildAuthHeader() });
      addToast("success", "Heslo změněno.");
      e.target.reset();
    } catch (e) { addToast("error", e.response?.data?.error || "Chyba."); } finally { setLoading(false); }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const newUsername = e.target.newUsername.value.trim();
    try {
      setLoading(true);
      await api.post("/auth/change-username", { newUsername }, { headers: buildAuthHeader() });
      setUser({ ...user, login: newUsername });
      addToast("success", "Jméno změněno.");
    } catch (e) { addToast("error", e.response?.data?.error || "Chyba."); } finally { setLoading(false); }
  };

  const handleInfoUpdate = async (e, field) => {
    e.preventDefault();
    const val = e.target[field].value.trim();
    try {
      setLoading(true);
      await api.patch("/client/update-info", { [field]: val }, { headers: buildAuthHeader() });
      addToast("success", "Údaj aktualizován.");
      loadDashboard();
    } catch (e) { addToast("error", e.response?.data?.error || "Chyba."); } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          <div>
            <h1 className="dashboard-title">Můj dashboard</h1>
            {client && <p className="dashboard-subtitle">Vítej, <strong>{client.fullName}</strong></p>}
          </div>
        </div>
      </header>

      <Sidebar open={sidebarOpen} active={activePanel} onSelect={setActivePanel} onClose={() => setSidebarOpen(false)} />

      {loading ? (
        <div className="dashboard-loading">Načítání dat...</div>
      ) : (
        <main className="dashboard-content">
          {activePanel === "dashboard" && (
            <div className="dashboard-grid">
              {client?.mustChangeCredentials && (
                <section className="card warning-card">
                  <h2 className="section-title">⚠ Musíš změnit údaje</h2>
                  <form onSubmit={handleCredSubmit} className="form">
                    <input className="field-input" type="text" placeholder="Nový login" value={credForm.newLogin} onChange={e => setCredForm({ ...credForm, newLogin: e.target.value })} />
                    <input className="field-input" type="password" placeholder="Nové heslo" value={credForm.newPassword} onChange={e => setCredForm({ ...credForm, newPassword: e.target.value })} />
                    <input className="field-input" type="password" placeholder="Potvrzení" value={credForm.confirmPassword} onChange={e => setCredForm({ ...credForm, confirmPassword: e.target.value })} />
                    {credError && <div className="inline-error">{credError}</div>}
                    <button className="btn btn-primary" type="submit" disabled={credLoading}>Uložit</button>
                  </form>
                </section>
              )}

              <ClientInfo client={client} />

              <CardManager
                cards={cards}
                client={client}
                currentCardIndex={currentCardIndex}
                setCurrentCardIndex={setCurrentCardIndex}
                onOpenCreateCard={() => setShowCreateCard(true)}
                formatCardNumber={formatCardNumber}
              />

              <ChildAccounts
                childrenAccounts={childrenAccounts}
                canCreateChildAccount={canCreateChildAccount}
                onOpenChildModal={() => setShowChildModal(true)}
              />

              <TransactionHistory
                transactions={transactions}
                formatDateTime={formatDateTime}
              />
            </div>
          )}

          {activePanel === "transfers" && (
            <TransferForm
              accTx={accTx}
              onAccTxChange={e => setAccTx({ ...accTx, [e.target.name]: e.target.value })}
              onSubmitAccTx={submitAccTx}
            />
          )}

          {activePanel === "settings-password" && <PasswordForm loading={loading} onSubmit={handlePasswordSubmit} />}
          {activePanel === "settings-username" && <UsernameForm user={user} loading={loading} onSubmit={handleUsernameSubmit} />}
          {activePanel === "settings-address" && <AddressForm client={client} loading={loading} onSubmit={e => handleInfoUpdate(e, "address")} />}
          {activePanel === "settings-phone" && <PhoneForm client={client} loading={loading} onSubmit={e => handleInfoUpdate(e, "phone")} />}
        </main>
      )}

      {/* Modální okna */}
      <CreateCardModal
        show={showCreateCard}
        onClose={() => setShowCreateCard(false)}
        newCardType={newCardType}
        setNewCardType={setNewCardType}
        newCardBrand={newCardBrand}
        setNewCardBrand={setNewCardBrand}
        onConfirm={handleConfirmCreateCard}
      />

      <ChildInviteModal
        show={showChildModal}
        onClose={() => setShowChildModal(false)}
        childForm={childForm}
        childErrors={childErrors}
        childLoading={childLoading}
        onInputChange={e => setChildForm({ ...childForm, [e.target.name]: e.target.value })}
        onSubmit={handleChildInviteSubmit}
      />
    </div>
  );
}
