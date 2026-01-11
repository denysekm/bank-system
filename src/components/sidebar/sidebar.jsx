import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar({ open, active, onSelect, onClose }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    onClose();
    navigate("/login");
  };

  const Item = ({ id, label, disabled = false }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onSelect(id);
        onClose();
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
          <Item id="settings" label="Settings" disabled />
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
