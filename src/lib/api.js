import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export async function initCsrf() {
  const { data } = await api.get("/csrf");
  api.defaults.headers.common["X-CSRF-Token"] = data.csrfToken;
}
