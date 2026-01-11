export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ROLE_ADMIN") {
    return res.status(403).json({ error: "Pouze pro admina" });
  }
  next();
}
