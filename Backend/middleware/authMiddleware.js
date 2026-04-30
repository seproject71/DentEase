const authService = require('../services/authService');

const getBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const authMiddleware = async (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Authorization bearer token is required' });
  }

  const { data, error } = await authService.getUserByToken(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const profileResult = await authService.fetchProfile(data.user.id);

  if (profileResult.error || !profileResult.data) {
    return res.status(403).json({ error: 'User profile not found' });
  }

  if (profileResult.data.is_active === false) {
    return res.status(403).json({ error: 'User account is inactive' });
  }

  req.accessToken = token;
  req.user = data.user;
  req.userProfile = profileResult.data;

  next();
};

module.exports = authMiddleware;
