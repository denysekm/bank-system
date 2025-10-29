import React, { createContext, useContext, useState } from "react";

// context, abychom sdíleli info o přihlášeném uživateli v celé appce
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user = { login, password, id, clientId, role }
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook pro pohodlné používání
export function useAuth() {
  return useContext(AuthContext);
}
