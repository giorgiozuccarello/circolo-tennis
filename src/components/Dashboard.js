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

const capitalizza = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getMeteoIcona = (weatherId) => {
  if (!weatherId) return "⛅";
  if (weatherId >= 200 && weatherId < 300) return "⛈️";
  if (weatherId >= 300 && weatherId < 400) return "🌦️";
  if (weatherId >= 500 && weatherId < 600) return "🌧️";
  if (weatherId >= 600 && weatherId < 700) return "❄️";
  if (weatherId >= 700 && weatherId < 800) return "🌫️";
  if (weatherId === 800) return "☀️";
  if (weatherId === 801) return "🌤️";
  if (weatherId === 802) return "⛅";
  return "🌥️";
};

const getFrecciaVento = (gradi) => {
  if (gradi === null || gradi === undefined) return "→";
  const direzioni = ["↓","↙","←","↖","↑","↗","→","↘"];
  const index = Math.round(gradi / 45) % 8;
  return direzioni[index];
};

const Lampadina = ({ accesa }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={accesa ? "#FFD700" : "#888888"}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7zm-1 16h2v1h-2v-1zm3-2H10v-1h4v1z"/>
  </svg>
);

const getMeteoPerOra = (forecast, dataSelezionata, ora) => {
  if (!forecast || forecast.length === 0) return null;
  const [h] = ora.split(":").map(Number);
  const target = new Date(`${dataSelezionata}T${String(h).padStart(2,"0")}:00:00`);
  let closest = null;
  let minDiff = Infinity;
  forecast.forEach(item => {
    const itemDate = new Date(item.dt * 1000);
    const diff = Math.abs(itemDate - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  });
  return closest;
};

function Dashboard({ user, onLogout }) {
  const [campo, setCampo] = useState("Campo 1");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conferma, setConferma] = useState(null);
  const [nomeUtente, setNomeUtente] = useState("");
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    caricaNome();
    caricaForecast();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPrenotazioni();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo, data]);

  const caricaNome = async () => {
    const userDoc = await getDoc(doc(db, "utenti", user.uid));
    if (userDoc.exists()) setNomeUtente(userDoc.data().nome);
  };

  const caricaForecast = async () => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=Sant%27Agata+di+Militello,IT&appid=f77cafddcb5fed6bfba7a452f0585f34&units=metric`
      );
      const json = await res.json();
      setForecast(json.list || []);
    } catch (e) {
      console.log("Errore forecast:", e);
    }
  };

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
    const cognome = userDoc.exists() ? capitalizza(userDoc.data().cognome) : user.email;
    await addDoc(collection(db, "prenotazioni"), {
      userId: user.uid,
      email: user.email,
      nome: cognome,
      campo, data, ora,
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
            background: "#111111", border: "2px solid white",
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

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px", position: "relative" }}>
        <button onClick={onLogout} style={{
          position: "absolute", right: 0, top: 0,
          padding: "6px 14px", cursor: "pointer", borderRadius: "8px",
          background: "#1a5c1a", color: "white", border: "none",
          fontWeight: "bold", fontSize: "14px"
        }}>Esci</button>
        <img src="/logo_ASD_Circolo_Tennis.png" alt="Logo" style={{ height: "120px", display: "block", margin: "0 auto" }} />
      </div>

      {/* Nome utente */}
      <p style={{ textAlign: "center", fontSize: "16px", marginBottom: "16px" }}>
        Benvenuto, <strong>{capitalizza(nomeUtente)}</strong>!
      </p>

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

      {/* Legenda icone */}
      <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginBottom: "10px", opacity: 0.8 }}>
        <span>⛅ Meteo</span>
        <span>→ Vento</span>
        <span>💡 Luce</span>
      </div>

      {/* Colonna Orari */}
      {loading ? <p>Caricamento...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {ORARI.map(ora => {
            const slot = getSlot(ora);
            const mio = slot && slot.userId === user.uid;
            const prenotato = !!slot;
            const h = parseInt(ora.split(":")[0]);
            const luceAccesa = h >= 20;
            const meteoOra = getMeteoPerOra(forecast, data, ora);

            return (
              <div key={ora} onClick={() => handleClick(ora, slot, mio)} style={{
                display: "flex", alignItems: "center",
                background: prenotato ? (mio ? "#2d7a2d" : "#7a2d2d") : "rgba(255,255,255,0.15)",
                borderRadius: "10px", padding: "8px 12px",
                cursor: prenotato && !mio ? "default" : "pointer",
                gap: "2px"
              }}>
                {/* Icona Meteo */}
                <span style={{ fontSize: "16px", minWidth: "20px", textAlign: "center" }}>
                  {meteoOra ? getMeteoIcona(meteoOra.weather[0].id) : "⛅"}
                </span>

                {/* Icona Vento */}
                <span style={{ fontSize: "16px", minWidth: "20px", textAlign: "center" }}>
                  {meteoOra ? getFrecciaVento(meteoOra.wind.deg) : "→"}
                </span>

                {/* Icona Luce */}
                <span style={{ minWidth: "20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lampadina accesa={luceAccesa} />
                </span>

                {/* Spazio separatore */}
                <span style={{ minWidth: "6px" }} />

                {/* Orario */}
                <span style={{ fontWeight: "bold", minWidth: "110px", fontSize: "15px" }}>
                  {ora} - {getFine(ora)}
                </span>

                {/* Nome socio con racchetta */}
                <span style={{ flex: 1, fontSize: "14px" }}>
                  {slot ? `🎾 ${slot.nome}` : ""}
                </span>

                {/* Checkbox */}
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