const dashboardService = require('../services/dashboardService');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const getSummary = async (req, res) => {
  const result = await dashboardService.getSummary();
  sendSupabaseResult(res, result);
};

module.exports = { getSummary };
