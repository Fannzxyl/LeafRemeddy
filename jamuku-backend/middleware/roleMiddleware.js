export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
};

export const requireManager = (req, res, next) => {
  if (!req.user || req.user.role !== "MANAGER") {
    return res.status(403).json({ message: "Hanya Manager yang boleh mengakses" });
  }
  next();
};

export const requireStaz = (req, res, next) => {
  if (!req.user || req.user.role !== "STAZ") {
    return res.status(403).json({ message: "Hanya StaZ yang boleh mengakses" });
  }
  next();
};
