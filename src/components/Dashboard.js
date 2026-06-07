import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc } from "firebase/firestore";

const ORARI = [];
for (let h = 8; h < 24; h++) {
  ORARI.push(`${String(h).padStart(2,"0")}:00`);
  ORARI.push(`${String(h).padStart(2,"0")}:30`);
}

const getFine = (ora) => {
  const [h, m] = ora.split(":").map(Number);
  const fine = m === 30 ? `${String(h+1).padStart(2,"0")}:00` : `${String(h).padStart(2,"0")}:30`;
  return fine;
};

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
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setPrenotazioni(list);
    setLoading(false);
  };

  const prenota = async (ora) => {
    const userDoc = await getDoc(doc(db, "utenti", user.uid));
    const username = userDoc.exists() ? userDoc.data().username : user.email;
    await addDoc(collection(db, "prenotazioni"), {
      userId: user.uid,
      email: user.email,
      nome: username,
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
            const prenotato = !!slot;

            return (
              <div key={ora} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: prenotato ? (mio ? "#2d7a2d" : "#7a2d2d") : "rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "10px 14px",
              }}>
                {/* Orario */}
                <span style={{ fontWeight: "bold", minWidth: "110px", fontSize: "15px" }}>
                  {ora} - {getFine(ora)}
                </span>

                {/* Nome socio */}
                <span style={{ flex: 1, paddingLeft: "10px", fontSize: "14px" }}>
                  {slot ? `👤 ${slot.nome}` : ""}
                </span>

                {/* Checkbox */}
                <div
                  onClick={() => { if (!prenotato) prenota(ora); else if (mio) cancella(slot.id); }}
                  style={{
                    width: "24px", height: "24px", borderRadius: "6px", border: "2px solid white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: prenotato && !mio ? "default" : "pointer",
                    background: prenotato ? "white" : "transparent",
                    flexShrink: 0
                  }}
                >
                  {prenotato && (
                    <span style={{ color: mio ? "#2d7a2d" : "#7a2d2d", fontWeight: "bold", fontSize: "16px" }}>✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;