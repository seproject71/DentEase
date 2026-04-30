const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

module.exports = corsMiddleware;
