const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const role = req.userProfile?.role;

  if (!role) {
    return res.status(403).json({ error: 'User role is missing' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'You do not have permission to access this resource' });
  }

  next();
};

const resourceRoleMap = {
  users: ['admin'],
  patients: ['admin', 'doctor', 'receptionist'],
  medical_alerts: ['admin', 'doctor'],
  appointments: ['admin', 'doctor', 'receptionist'],
  treatments: ['admin', 'doctor'],
  prescriptions: ['admin', 'doctor'],
  invoices: ['admin', 'doctor'],
  payments: ['admin', 'doctor'],
};

const resourceMethodRoleMap = {
  appointments: {
    GET: ['admin', 'doctor', 'receptionist'],
    POST: ['admin', 'receptionist'],
    PUT: ['admin', 'receptionist'],
    DELETE: ['admin', 'receptionist'],
  },
};

const authorizeResource = (resource) => {
  const allowedRoles = resourceRoleMap[resource] || ['admin'];
  return authorizeRoles(...allowedRoles);
};

const authorizeResourceAction = (resource) => (req, res, next) => {
  const methodRoles = resourceMethodRoleMap[resource]?.[req.method];
  const allowedRoles = methodRoles || resourceRoleMap[resource] || ['admin'];
  return authorizeRoles(...allowedRoles)(req, res, next);
};

module.exports = { authorizeResource, authorizeResourceAction, authorizeRoles, resourceMethodRoleMap, resourceRoleMap };
