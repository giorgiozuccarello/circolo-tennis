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
  return m === 30 ? `${String(h+1).padStart(2,"0")}:00` : `${String(h).padStart(2,"0")}:30`;
};

function Dashboard({ user, onLogout }) {
  const [campo, setCampo] = useState("Campo 1");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conferma, setConferma] = useState(null);

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

  const handleClick = (ora, slot, mio) => {
    if (!slot) setConferma({ tipo: "prenota", ora, id: null });
    else if (mio) setConferma({ tipo: "cancella", ora, id: slot.id });
  };

  const handleConferma = async () => {
    if (conferma.tipo === "prenota") await prenota(conferma.ora);
    else await cancella(conferma.id);
    setConferma(null);
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px", color: "white" }}>

      {/* Popup conferma */}
      {conferma && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#111111",
            border: "2px solid white",
            borderRadius: "16px", padding: "30px",
            maxWidth: "300px", width: "90%", textAlign: "center", color: "white"
          }}>
            <h3 style={{ marginTop: 0 }}>
              {conferma.tipo === "prenota" ? "Conferma prenotazione" : "Cancella prenotazione"}
            </h3>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              {campo} — {conferma.ora} - {getFine(conferma.ora)}
            </p>
            <p>{data}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
              <button onClick={() => setConferma(null)} style={{
                padding: "10px 20px", borderRadius: "8px", border: "2px solid white",
                background: "transparent", color: "white", cursor: "pointer", fontWeight: "bold"
              }}>Annulla</button>
              <button onClick={handleConferma} style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: "white", color: "#111111", cursor: "pointer", fontWeight: "bold"
              }}>
                {conferma.tipo === "prenota" ? "Prenota ✓" : "Cancella ✗"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header con logo centrato e tasto Esci */}
      <div style={{ textAlign: "center", marginBottom: "20px", position: "relative" }}>
        <button onClick={onLogout} style={{
          position: "absolute", right: 0, top: 0,
          padding: "6px 14px", cursor: "pointer", borderRadius: "8px"
        }}>Esci</button>
        <img src="\logo_ASD_Circolo_Tennis.png" alt="Logo" style={{ height: "100px", display: "block", margin: "0 auto" }} />
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
              <div key={ora} onClick={() => handleClick(ora, slot, mio)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: prenotato ? (mio ? "#2d7a2d" : "#7a2d2d") : "rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "10px 14px",
                cursor: prenotato && !mio ? "default" : "pointer"
              }}>
                <span style={{ fontWeight: "bold", minWidth: "120px", fontSize: "15px" }}>
                  {ora} - {getFine(ora)}
                </span>
                <span style={{ flex: 1, paddingLeft: "10px", fontSize: "14px" }}>
                  {slot ? `👤 ${slot.nome}` : ""}
                </span>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "6px", border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: prenotato ? "white" : "transparent", flexShrink: 0
                }}>
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