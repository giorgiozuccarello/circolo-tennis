import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(null);

  const handleSubmit = async () => {
    setError("");
    try {
      if (isRegister) {
        if (!nome || !cognome || !username) {
          setError("Compila tutti i campi!");
          return;
        }
        auth.languageCode = "it";
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Logout IMMEDIATO
        await signOut(auth);

        // Salva dati utente
        await setDoc(doc(db, "utenti", cred.user.uid), {
          nome, cognome, username, email, createdAt: new Date()
        });

        // Manda email di verifica
        await sendEmailVerification(cred.user, {
          url: "https://circolo-tennis-chi.vercel.app"
        });

        setPopup("registrato");

      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setPopup("nonVerificato");
          return;
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const inputStyle = {
    display: "block", width: "100%", padding: "10px",
    marginBottom: "10px", borderRadius: "8px", border: "none",
    fontSize: "15px", boxSizing: "border-box"
  };

  const popupStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 100
  };

  const boxStyle = {
    background: "#111111", border: "2px solid white",
    borderRadius: "16px", padding: "30px",
    maxWidth: "320px", width: "90%", textAlign: "center", color: "white"
  };

  return (
    <div style={{
      maxWidth: "400px", margin: "80px auto", padding: "30px",
      background: "rgba(0,0,0,0.25)", borderRadius: "16px", color: "white"
    }}>

      {/* Popup registrazione completata */}
      {popup === "registrato" && (
        <div style={popupStyle}>
          <div style={boxStyle}>
            <h3 style={{ marginTop: 0 }}>✅ Registrazione completata!</h3>
            <p>Abbiamo inviato una email di conferma a:</p>
            <p style={{ fontWeight: "bold", color: "#ffdd88" }}>{email}</p>
            <p>Clicca sul link nella email per attivare il tuo account, poi accedi.</p>
            <p style={{ fontSize: "13px", color: "#aaa" }}>Controlla anche la cartella spam.</p>
            <button onClick={() => { setPopup(null); setIsRegister(false); }} style={{
              marginTop: "16px", padding: "10px 24px", borderRadius: "8px",
              border: "none", background: "white", color: "#111111",
              fontWeight: "bold", cursor: "pointer", fontSize: "15px"
            }}>OK, vai al login</button>
          </div>
        </div>
      )}

      {/* Popup email non verificata */}
      {popup === "nonVerificato" && (
        <div style={popupStyle}>
          <div style={boxStyle}>
            <h3 style={{ marginTop: 0 }}>⚠️ Email non verificata</h3>
            <p>Hai già ricevuto una email da Firebase.</p>
            <p>Clicca sul link nella email per attivare il tuo account, poi prova ad accedere di nuovo.</p>
            <p style={{ fontSize: "13px", color: "#aaa" }}>Controlla anche la cartella spam.</p>
            <button onClick={() => setPopup(null)} style={{
              marginTop: "16px", padding: "10px 24px", borderRadius: "8px",
              border: "none", background: "white", color: "#111111",
              fontWeight: "bold", cursor: "pointer", fontSize: "15px"
            }}>OK, ho capito</button>
          </div>
        </div>
      )}

      <img src="/logo.jpeg" alt="Logo" style={{ display: "block", margin: "0 auto 20px", width: "220px" }} />

      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        {isRegister ? "Registrati" : "Accedi"}
      </h3>

      {isRegister && (
        <>
          <input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
          <input placeholder="Cognome" value={cognome} onChange={e => setCognome(e.target.value)} style={inputStyle} />
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
        </>
      )}

      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
      <input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />

      {error && <p style={{ color: "#ffcccc", fontSize: "13px" }}>{error}</p>}

      <button onClick={handleSubmit} style={{
        width: "100%", padding: "12px", background: "white", color: "#bb5522",
        border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer"
      }}>
        {isRegister ? "Registrati" : "Accedi"}
      </button>

      <p style={{ textAlign: "center", marginTop: "16px" }}>
        {isRegister ? "Hai già un account?" : "Non hai un account?"}
        <span onClick={() => { setIsRegister(!isRegister); setError(""); setPopup(null); }}
          style={{ color: "white", fontWeight: "bold", cursor: "pointer", marginLeft: "6px", textDecoration: "underline" }}>
          {isRegister ? "Accedi" : "Registrati"}
        </span>
      </p>
    </div>
  );
}

export default Login;