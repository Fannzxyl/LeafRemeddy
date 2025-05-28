// middleware/roleMiddleware.js
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Akses ditolak",
        requiredRoles: allowedRoles,
        userRole: req.user?.role 
      });
    }
    next();
  };
};

export const requireManager = (req, res, next) => {
  if (!req.user || req.user.role !== "MANAGER") {
    return res.status(403).json({ 
      message: "Hanya Manager yang dapat mengakses fitur ini" 
    });
  }
  next();
};

export const requireStaz = (req, res, next) => {
  if (!req.user || req.user.role !== "STAZ") {
    return res.status(403).json({ 
      message: "Hanya StaZ yang dapat mengakses fitur ini" 
    });
  }
  next();
};

export const requireStazOrManager = (req, res, next) => {
  if (!req.user || !["STAZ", "MANAGER"].includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Akses ditolak - hanya StaZ atau Manager" 
    });
  }
  next();
};