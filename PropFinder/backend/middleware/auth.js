const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Acceso denegado. Rol no especificado en el token' });
    }
    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
};

const authenticateAgent = [authenticateToken, authorizeRoles('agent')];
const authenticateAdmin = [authenticateToken, authorizeRoles('admin')];

module.exports = {
  authenticateToken,
  authorizeRoles,
  authenticateAgent,
  authenticateAdmin,
};
