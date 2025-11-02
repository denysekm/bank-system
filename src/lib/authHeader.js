export function makeAuthHeader(user) {
  if (!user) return {};
  // bezpečná Base64 pro diakritiku
  const raw = `${user.login}:${user.password}`;
  const base64 = btoa(unescape(encodeURIComponent(raw)));
  return { Authorization: `Basic ${base64}` };
}
