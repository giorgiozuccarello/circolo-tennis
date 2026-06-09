import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (registrando) {
        setLoading(false);
        return;
      }
      if (currentUser && !currentUser.emailVerified) {
        await signOut(auth);
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [registrando]);

  if (loading) return (
    <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
      Caricamento...
    </div>
  );

  return (
    <div>
      {user ? (
        <Dashboard user={user} onLogout={() => signOut(auth)} />
      ) : (
        <Login onRegistrando={setRegistrando} />
      )}
    </div>
  );
}

export default App;