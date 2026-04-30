const invoiceService = require('../services/invoiceService');
const pdfService = require('../services/pdfService');
const resourceService = require('../services/resourceService');
const { resources } = require('../models/resourceModel');
const { pick, validateRequired } = require('../utils/requestUtils');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const invoiceOptions = resources.invoices;

const list = async (req, res) => {
  const result = await resourceService.list('invoices', invoiceOptions, req.query);
  sendSupabaseResult(res, result);
};

const getById = async (req, res) => {
  const result = await resourceService.getById('invoices', req.params.id);
  sendSupabaseResult(res, result);
};

const downloadPdf = async (req, res) => {
  const result = await pdfService.generateInvoicePdf(req.params.id);

  if (result.error) {
    const status = result.error.status || (result.error.code === 'PGRST116' ? 404 : 400);
    return res.status(status).json({ error: result.error.message, code: result.error.code });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${result.data.filename}"`);
  return res.send(result.data.buffer);
};

const create = async (req, res) => {
  const missing = validateRequired(req.body, invoiceOptions.required);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  if (req.body.treatment_id) {
    const treatmentResult = await resourceService.getById('treatments', req.body.treatment_id);

    if (treatmentResult.error || !treatmentResult.data) {
      return res.status(404).json({ error: 'Treatment not found' });
    }
  }

  const result = await invoiceService.createInvoice(req.body);
  sendSupabaseResult(res, result, 201);
};

const update = async (req, res) => {
  const payload = pick(req.body, invoiceOptions.mutable);

  if (Object.keys(payload).length === 0) {
    return res.status(422).json({ error: 'No valid fields provided' });
  }

  let recalculatedPayload = payload;

  if (payload.total_amount !== undefined || payload.discount !== undefined || payload.paid_amount !== undefined) {
    const invoiceResult = await resourceService.getById('invoices', req.params.id);

    if (invoiceResult.error || !invoiceResult.data) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    recalculatedPayload = {
      ...payload,
      ...invoiceService.calculateInvoiceFields({
        total_amount: payload.total_amount ?? invoiceResult.data.total_amount,
        discount: payload.discount ?? invoiceResult.data.discount,
        paid_amount: payload.paid_amount ?? invoiceResult.data.paid_amount,
      }),
    };
  }

  const result = await resourceService.update('invoices', invoiceOptions, req.params.id, recalculatedPayload);
  sendSupabaseResult(res, result);
};

const remove = async (req, res) => {
  const result = await resourceService.remove('invoices', req.params.id);
  sendSupabaseResult(res, result);
};

module.exports = { create, downloadPdf, getById, list, remove, update };
