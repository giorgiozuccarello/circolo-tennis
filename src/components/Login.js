import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", textAlign: "center" }}>
      <h1>🎾 Circolo Tennis Sant'Agata</h1>
      <h2>{isRegister ? "Registrati" : "Accedi"}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        onClick={handleSubmit}
        style={{ padding: "10px 20px", background: "green", color: "white", border: "none", cursor: "pointer" }}
      >
        {isRegister ? "Registrati" : "Accedi"}
      </button>
      <p>
        {isRegister ? "Hai già un account?" : "Non hai un account?"}
        <span
          onClick={() => setIsRegister(!isRegister)}
          style={{ color: "blue", cursor: "pointer", marginLeft: "5px" }}
        >
          {isRegister ? "Accedi" : "Registrati"}
        </span>
      </p>
    </div>
  );
}

export default Login;