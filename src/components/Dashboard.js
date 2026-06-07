import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

const ORARI = [];
for (let h = 8; h < 24; h++) {
  ORARI.push(`${String(h).padStart(2,"0")}:00`);
  ORARI.push(`${String(h).padStart(2,"0")}:30`);
}

function Dashboard({ user, onLogout }) {
  const [campo, setCampo] = useState("Campo 1");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrenotazioni();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo, data]);

  const loadPrenotazioni = async () => {
    setLoading(true);
    const q = query(
      collection(db, "prenotazioni"),
      where("campo", "==", campo),
      where("data", "==", data)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPrenotazioni(list);
    setLoading(false);
  };

  const prenota = async (ora) => {
    const nome = user.displayName || user.email;
    await addDoc(collection(db, "prenotazioni"), {
      userId: user.uid,
      email: user.email,
      nome,
      campo,
      data,
      ora,
      createdAt: new Date()
    });
    loadPrenotazioni();
  };

  const cancella = async (id) => {
    await deleteDoc(doc(db, "prenotazioni", id));
    loadPrenotazioni();
  };

  const getSlot = (ora) => prenotazioni.find(p => p.ora === ora);

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>🎾 Circolo Tennis Sant'Agata</h2>
        <button onClick={onLogout} style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "8px" }}>Esci</button>
      </div>

      {/* Selettore Campo */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {["Campo 1", "Campo 2"].map(c => (
          <button key={c} onClick={() => setCampo(c)} style={{
            flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: campo === c ? "white" : "rgba(255,255,255,0.2)",
            color: campo === c ? "#bb5522" : "white",
            fontWeight: "bold", fontSize: "16px"
          }}>{c}</button>
        ))}
      </div>

      {/* Selettore Data */}
      <input type="date" value={data} onChange={e => setData(e.target.value)}
        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "none",
          fontSize: "16px", marginBottom: "16px", boxSizing: "border-box" }} />

      {/* Colonna Orari */}
      {loading ? <p>Caricamento...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {ORARI.map(ora => {
            const slot = getSlot(ora);
            const mio = slot && slot.userId === user.uid;
            return (
              <div key={ora} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: slot ? (mio ? "#2d7a2d" : "#7a2d2d") : "rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "10px 14px",
                cursor: slot ? (mio ? "pointer" : "default") : "pointer"
              }}
                onClick={() => { if (!slot) prenota(ora); else if (mio) cancella(slot.id); }}
              >
                <span style={{ fontWeight: "bold", minWidth: "50px" }}>{ora}</span>
                <span>{slot ? `👤 ${slot.nome}${mio ? " (tocca per cancellare)" : ""}` : "Libero — tocca per prenotare"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;