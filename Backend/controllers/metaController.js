const { supabase, supabaseAdmin } = require('../config/db');
const { resources } = require('../models/resourceModel');

const getRoot = (req, res) => {
  res.json({
    name: 'DentEase API',
    status: 'running',
    docs: '/api',
  });
};

const getApiIndex = (req, res) => {
  res.json({
    resources: Object.keys(resources).map((resource) => `/api/${resource}`),
    health: '/api/health',
  });
};

const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    authConfigured: Boolean(supabase),
    databaseConfigured: Boolean(supabaseAdmin),
  });
};

module.exports = { getApiIndex, getHealth, getRoot };
