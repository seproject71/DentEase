const appointmentService = require('../services/appointmentService');
const { pick, validateRequired } = require('../utils/requestUtils');
const { sendSupabaseResult } = require('../utils/supabaseResponse');

const appointmentFields = [
  'patient_id',
  'doctor_id',
  'start_time',
  'end_time',
  'appointment_time',
  'reason_for_visit',
  'status',
];

const sendAppointmentResult = (res, result, successStatus = 200) => {
  if (result.error?.status === 409) {
    return res.status(409).json({
      error: result.error.message,
      conflict: result.conflict,
    });
  }

  sendSupabaseResult(res, result, successStatus);
};

const list = async (req, res) => {
  const result = await appointmentService.list(req.query);
  sendSupabaseResult(res, result);
};

const getById = async (req, res) => {
  const result = await appointmentService.getById(req.params.id);
  sendSupabaseResult(res, result);
};

const create = async (req, res) => {
  const missing = validateRequired(req.body, ['patient_id', 'doctor_id', 'start_time', 'end_time']);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  const result = await appointmentService.create(req.body);
  sendAppointmentResult(res, result, 201);
};

const update = async (req, res) => {
  const payload = pick(req.body, appointmentFields);

  if (Object.keys(payload).length === 0) {
    return res.status(422).json({ error: 'No valid fields provided' });
  }

  const result = await appointmentService.update(req.params.id, req.body);
  sendAppointmentResult(res, result);
};

const remove = async (req, res) => {
  const result = await appointmentService.remove(req.params.id);
  sendSupabaseResult(res, result);
};

module.exports = { create, getById, list, remove, update };
