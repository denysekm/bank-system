import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './mainPage/navbar/Navbar.jsx';
import Main from './mainPage/main/Main.jsx';
import Register from './mainPage/register/Register.jsx';
import Dashboard from './mainPage/dashboard/Dashboard.jsx';
import Login from './mainPage/login/Login.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Hlavní stránka s Navbar */}
        <Route
          path="/"
          element={
            <>
              <Navbar />  {/* Zobrazí navbar pouze na hlavní stránce */}
              <Main />    {/* Zobrazí hlavní obsah titulní stránky */}
            </>
          }
        />

        {/* Registrace bez Navbar */}
        <Route path="/register" element={<Register />} />

        {/* Přihlášení bez Navbar */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
