import React, { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-logo">Moje Banka</div>

      <nav className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <a href="#home">Domů</a>
        <a href="#about">O nás</a>
        <a href="#services">Služby</a>
        <a href="#contact">Kontakt</a>
      </nav>

      {/* hamburger menu pro mobil */}
      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>
    </header>
  );
}

export default Navbar;
