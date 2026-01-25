import React, { useState } from "react";
import { useAuth } from "../../../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar({ open, active, onSelect, onClose }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    onClose();
    navigate("/login");
  };

  const Item = ({ id, label, disabled = false, onClick }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (onClick) {
          onClick();
        } else {
          onSelect(id);
          onClose();
        }
      }}
      className={[
        "sb-item",
        active === id ? "active" : "",
        disabled ? "disabled" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={open ? "sb-overlay open" : "sb-overlay"}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside className={open ? "sb-panel open" : "sb-panel"}>
        <div className="sb-top">
          <div className="sb-title">Menu</div>
          <button className="sb-close" onClick={onClose}>✕</button>
        </div>

        {/* ⬆️ HORNÍ MENU */}
        <nav className="sb-nav">
          <Item id="dashboard" label="Dashboard" />
          <Item id="transfers" label="Převody mezi účty" />
          <Item id="credits" label="Credits" disabled />

          <div className={`sb-settings-group ${settingsOpen ? "open" : ""}`}>
            <Item
              id="settings"
              label={
                <div className="sb-settings-label">
                  <span>Settings</span>
                  <span className="sb-arrow">{settingsOpen ? "▼" : "▶"}</span>
                </div>
              }
              onClick={() => setSettingsOpen(!settingsOpen)}
            />
            {settingsOpen && (
              <div className="sb-submenu">
                <button
                  className={`sb-subitem ${active === "settings-password" ? "active" : ""}`}
                  onClick={() => { onSelect("settings-password"); onClose(); }}
                >
                  Změna hesla
                </button>
                <button
                  className={`sb-subitem ${active === "settings-username" ? "active" : ""}`}
                  onClick={() => { onSelect("settings-username"); onClose(); }}
                >
                  Změna uživ. jména
                </button>
                <button
                  className={`sb-subitem ${active === "settings-address" ? "active" : ""}`}
                  onClick={() => { onSelect("settings-address"); onClose(); }}
                >
                  Změna adresy
                </button>
                <button
                  className={`sb-subitem ${active === "settings-phone" ? "active" : ""}`}
                  onClick={() => { onSelect("settings-phone"); onClose(); }}
                >
                  Změna telefonu
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ⬇️ SPODNÍ ČÁST – ODLÁŠENÍ */}
        <div className="sb-bottom">
          <button className="sb-logout" onClick={handleLogout}>
            Odhlásit se
          </button>
        </div>
      </aside>
    </>
  );
}
