const treatmentService = require('../services/treatmentService');
const resourceService = require('../services/resourceService');
const { resources } = require('../models/resourceModel');
const { pick, validateRequired } = require('../utils/requestUtils');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const treatmentOptions = resources.treatments;

const list = async (req, res) => {
  const result = await resourceService.list('treatments', treatmentOptions, req.query);
  sendSupabaseResult(res, result);
};

const getById = async (req, res) => {
  const result = await resourceService.getById('treatments', req.params.id);
  sendSupabaseResult(res, result);
};

const create = async (req, res) => {
  const missing = validateRequired(req.body, treatmentOptions.required);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  const result = await treatmentService.create(req.body);
  sendSupabaseResult(res, result, 201);
};

const update = async (req, res) => {
  const payload = pick(req.body, treatmentOptions.mutable);

  if (Object.keys(payload).length === 0) {
    return res.status(422).json({ error: 'No valid fields provided' });
  }

  const result = await treatmentService.update(req.params.id, req.body);
  sendSupabaseResult(res, result);
};

const remove = async (req, res) => {
  const result = await resourceService.remove('treatments', req.params.id);
  sendSupabaseResult(res, result);
};

module.exports = { create, getById, list, remove, update };
