const paymentService = require('../services/paymentService');
const { pick, validateRequired } = require('../utils/requestUtils');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const paymentFields = ['invoice_id', 'amount_paid', 'payment_method', 'processed_by'];

const list = async (req, res) => {
  const result = await paymentService.list(req.query);
  sendSupabaseResult(res, result);
};

const getById = async (req, res) => {
  const result = await paymentService.getById(req.params.id);
  sendSupabaseResult(res, result);
};

const create = async (req, res) => {
  const missing = validateRequired(req.body, ['invoice_id', 'amount_paid']);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  const result = await paymentService.createPayment({
    ...req.body,
    processed_by: req.userProfile.id,
  });

  sendSupabaseResult(res, result, 201);
};

const update = async (req, res) => {
  const payload = pick(req.body, paymentFields);

  if (Object.keys(payload).length === 0) {
    return res.status(422).json({ error: 'No valid fields provided' });
  }

  const result = await paymentService.update(req.params.id, payload);
  sendSupabaseResult(res, result);
};

const remove = async (req, res) => {
  const result = await paymentService.remove(req.params.id);
  sendSupabaseResult(res, result);
};

module.exports = { create, getById, list, remove, update };
