const authService = require('../services/authService');

const missingFields = (body, fields) =>
  fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');

const sendAuthResult = (res, { data, error }, successStatus = 200) => {
  if (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  return res.status(successStatus).json(data);
};

const signup = async (req, res) => {
  const missing = missingFields(req.body, ['email', 'password', 'role']);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  const result = await authService.signup(req.body);
  sendAuthResult(res, result, 201);
};

const login = async (req, res) => {
  const missing = missingFields(req.body, ['email', 'password']);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  const result = await authService.login(req.body);
  sendAuthResult(res, result);
};

const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully. Remove the access token from the client.' });
};

const getCurrentUser = async (req, res) => {
  res.json({
    user: req.user,
    profile: req.userProfile,
    role: req.userProfile.role,
  });
};

module.exports = { getCurrentUser, login, logout, signup };
