import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

function Dashboard({ user, onLogout }) {
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [data, setData] = useState("");
  const [ora, setOra] = useState("");
  const [campo, setCampo] = useState("Campo 1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPrenotazioni();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPrenotazioni = async () => {
    const q = query(collection(db, "prenotazioni"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrenotazioni(list);
  };

  const prenota = async () => {
    if (!data || !ora) {
      setMessage("Seleziona data e ora!");
      return;
    }
    await addDoc(collection(db, "prenotazioni"), {
      userId: user.uid,
      email: user.email,
      campo,
      data,
      ora,
      createdAt: new Date()
    });
    setMessage("✅ Prenotazione confermata!");
    setData("");
    setOra("");
    loadPrenotazioni();
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <h1>🎾 Circolo Tennis Sant'Agata</h1>
      <p>Benvenuto, <strong>{user.email}</strong></p>
      <button onClick={onLogout} style={{ float: "right", padding: "8px 16px", cursor: "pointer" }}>
        Esci
      </button>

      <h2>Prenota un campo</h2>
      <select value={campo} onChange={(e) => setCampo(e.target.value)}
        style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px" }}>
        <option>Campo 1</option>
        <option>Campo 2</option>
        <option>Campo 3</option>
      </select>
      <input type="date" value={data} onChange={(e) => setData(e.target.value)}
        style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px" }} />
      <select value={ora} onChange={(e) => setOra(e.target.value)}
        style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px" }}>
        <option value="">Seleziona ora</option>
        <option>09:00</option>
        <option>10:00</option>
        <option>11:00</option>
        <option>12:00</option>
        <option>15:00</option>
        <option>16:00</option>
        <option>17:00</option>
        <option>18:00</option>
        <option>19:00</option>
        <option>20:00</option>
      </select>
      <button onClick={prenota}
        style={{ padding: "10px 20px", background: "green", color: "white", border: "none", cursor: "pointer", width: "100%" }}>
        Prenota
      </button>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <h2>Le tue prenotazioni</h2>
      {prenotazioni.length === 0 ? (
        <p>Nessuna prenotazione ancora.</p>
      ) : (
        prenotazioni.map((p) => (
          <div key={p.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "8px" }}>
            <strong>{p.campo}</strong> — {p.data} alle {p.ora}
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;