const { supabaseAdmin } = require('../config/db');

const requireDb = (req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'Database is not configured',
      details: 'Create Backend/.env from .env.example and set SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  next();
};

module.exports = requireDb;
