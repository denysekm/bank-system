import { makeAuthHeader } from "../lib/authHeader";

const BASE = "http://localhost:5000/api";

async function post(path, body, user) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...makeAuthHeader(user) },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "REQUEST_FAILED");
  }
  return data;
}

export const BankApi = {
  replenish: (payload, user) => post("/cards/replenish", payload, user),
  transfer:  (payload, user) => post("/cards/transfer",  payload, user),
  mobile:    (payload, user) => post("/cards/mobile",    payload, user),
};
