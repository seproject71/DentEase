const resourceService = require('../services/resourceService');
const { pick, validateRequired } = require('../utils/requestUtils');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const makeResourceController = (resource, options) => ({
  list: async (req, res) => {
    const result = await resourceService.list(resource, options, req.query);
    sendSupabaseResult(res, result);
  },

  getById: async (req, res) => {
    const result = await resourceService.getById(resource, req.params.id);
    sendSupabaseResult(res, result);
  },

  create: async (req, res) => {
    const missing = validateRequired(req.body, options.required);

    if (missing.length > 0) {
      return res.status(422).json({ error: 'Missing required fields', fields: missing });
    }

    const result = await resourceService.create(resource, options, req.body);
    sendSupabaseResult(res, result, 201);
  },

  update: async (req, res) => {
    const payload = pick(req.body, options.mutable);

    if (Object.keys(payload).length === 0) {
      return res.status(422).json({ error: 'No valid fields provided' });
    }

    const result = await resourceService.update(resource, options, req.params.id, req.body);
    sendSupabaseResult(res, result);
  },

  remove: async (req, res) => {
    const result = await resourceService.remove(resource, req.params.id);
    sendSupabaseResult(res, result);
  },
});

module.exports = makeResourceController;
