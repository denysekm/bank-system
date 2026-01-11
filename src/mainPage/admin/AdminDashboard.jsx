import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { api } from "../../lib/api";
import { makeAuthHeader } from "../../lib/authHeader";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, setUser } = useAuth(); // ⬅️ pokud setUser nemáš v contextu, smaž setUser
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) navigate("/login");
    if (user && user.role !== "ROLE_ADMIN") navigate("/dashboard");
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setErr("");
      setLoading(true);

      const headers = makeAuthHeader(user);
      const res = await api.get("/admin/users", { headers });

      setUsers(res.data.users || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Nepodařilo se načíst uživatele");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(clientId, fullName) {
    const ok = window.confirm(
      `Opravdu chceš smazat uživatele: ${fullName} (ID ${clientId})?`
    );
    if (!ok) return;

    try {
      setErr("");
      const headers = makeAuthHeader(user);
      await api.delete(`/admin/users/${clientId}`, { headers });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Mazání selhalo");
    }
  }

  function handleLogout() {
    // pokud nemáš setUser, tak jen navigate("/login")
    if (setUser) setUser(null);
    navigate("/login");
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2 className="admin-heading">Admin rozhraní</h2>
          <div className="admin-subtitle">Správa uživatelů a jejich účtů</div>
        </div>

        <button className="admin-logout-btn" onClick={handleLogout}>
          Odhlásit
        </button>
      </div>

      {err && <div className="admin-error">{err}</div>}

      <div className="admin-card">
        <h3 className="admin-section-title">Uživatelé</h3>

        {loading ? (
          <div className="admin-loading">Načítám...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Jméno</th>
                  <th>Login</th>
                  <th>Datum narození</th>
                  <th>Pas</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      Žádní uživatelé
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.clientId}>
                      <td>{u.clientId}</td>
                      <td>{u.fullName}</td>
                      <td>{u.login}</td>
                      <td>{u.birthDate ? String(u.birthDate).slice(0, 10) : ""}</td>
                      <td>{u.passportNumber}</td>
                      <td>
                        <button
                          className="admin-delete-btn"
                          onClick={() => handleDelete(u.clientId, u.fullName)}
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
