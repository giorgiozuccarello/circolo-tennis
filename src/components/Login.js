import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    try {
      if (isRegister) {
        if (!nome || !cognome || !username) {
          setError("Compila tutti i campi!");
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "utenti", cred.user.uid), {
          nome,
          cognome,
          username,
          email,
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "30px",
      background: "rgba(0,0,0,0.25)", borderRadius: "16px", color: "white" }}>
      <h1 style={{ textAlign: "center", marginBottom: "8px" }}>🎾</h1>
      <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
        Circolo Tennis Sant'Agata
      </h2>
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
        <span onClick={() => { setIsRegister(!isRegister); setError(""); }}
          style={{ color: "white", fontWeight: "bold", cursor: "pointer", marginLeft: "6px", textDecoration: "underline" }}>
          {isRegister ? "Accedi" : "Registrati"}
        </span>
      </p>
    </div>
  );
}

export default Login;