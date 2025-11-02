import React, { useState } from "react";
import { BankApi } from "../api/bankApi";
import { useAuth } from "../AuthContext";

export default function CardActions() {
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [repl, setRepl] = useState({ card: "", amount: "", paymentMethod: "CARD" });
  const [cc, setCc]     = useState({ fromCard: "", toCard: "", amount: "", description: "" });
  const [mob, setMob]   = useState({ fromCard: "", phone: "", amount: "" });

  const on = (setter) => (e) => setter(s => ({ ...s, [e.target.name]: e.target.value }));

  async function go(fn, payload, okMsg) {
    setMsg(""); setErr("");
    try {
      const p = { ...payload };
      if (p.amount !== undefined) p.amount = Number(p.amount);
      await fn(p, user);
      setMsg(okMsg);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Operace s kartami</h3>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <form onSubmit={(e)=>{e.preventDefault(); go(BankApi.replenish, repl, "Dobití úspěšné.");}}
              style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e5e5" }}>
          <h4>Dobít kartu</h4>
          <input name="card" placeholder="Číslo karty" onChange={on(setRepl)} />
          <input name="amount" type="number" step="0.01" placeholder="Částka" onChange={on(setRepl)} />
          <input name="paymentMethod" placeholder="Metoda (např. CARD)" onChange={on(setRepl)} />
          <button>Dobít</button>
        </form>

        <form onSubmit={(e)=>{e.preventDefault(); go(BankApi.transfer, cc, "Převod proběhl.");}}
              style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e5e5" }}>
          <h4>Převod karta → karta</h4>
          <input name="fromCard" placeholder="Z karty" onChange={on(setCc)} />
          <input name="toCard"   placeholder="Na kartu" onChange={on(setCc)} />
          <input name="amount"   type="number" step="0.01" placeholder="Částka" onChange={on(setCc)} />
          <input name="description" placeholder="Poznámka" onChange={on(setCc)} />
          <button>Převést</button>
        </form>

        <form onSubmit={(e)=>{e.preventDefault(); go(BankApi.mobile, mob, "Mobilní převod proběhl.");}}
              style={{ padding: 16, borderRadius: 12, border: "1px solid #e5e5e5" }}>
          <h4>Převod na telefon</h4>
          <input name="fromCard" placeholder="Z karty" onChange={on(setMob)} />
          <input name="phone"    placeholder="Telefon" onChange={on(setMob)} />
          <input name="amount"   type="number" step="0.01" placeholder="Částka" onChange={on(setMob)} />
          <button>Odeslat</button>
        </form>
      </div>

      {(msg || err) && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}>
          {msg && <div style={{ color: "green" }}>{msg}</div>}
          {err && <div style={{ color: "crimson" }}>{err}</div>}
        </div>
      )}
    </div>
  );
}
