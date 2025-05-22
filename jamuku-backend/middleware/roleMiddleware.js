export const requireStaz = (req, res, next) => {
  if (req.user.role !== "STAZ") {
    return res.status(403).json({ 
      message: "Hanya STAZ yang boleh mengakses" 
    });
  }
  next();
};

export const requireManager = (req, res, next) => {
  if (req.user.role !== "MANAGER") {
    return res.status(403).json({ 
      message: "Hanya Manager yang boleh mengakses" 
    });
  }
  next();
};