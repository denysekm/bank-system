import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";

import Navbar from "./mainPage/navbar/Navbar.jsx";
import Main from "./mainPage/main/Main.jsx";
import Register from "./mainPage/register/Register.jsx";
import Dashboard from "./mainPage/dashboard/Dashboard.jsx";
import Login from "./mainPage/login/Login.jsx";
import AdminDashboard from "./mainPage/admin/AdminDashboard.jsx";


import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Hlavní stránka s Navbar */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Main />
                </>
              }
            />

            {/* Registrace bez Navbar */}
            <Route path="/register" element={<Register />} />

            {/* Login bez Navbar */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard (po přihlášení) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Fallback – cokoliv jiného pošleme na domů */}
            <Route path="*" element={<Navigate to="/" />} />
            {/* Dashboard (pro admina) */}
            <Route path="/admin" element={<AdminDashboard />} />

          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
