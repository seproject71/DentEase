const prescriptionService = require('../services/prescriptionService');
const pdfService = require('../services/pdfService');
const { validateRequired } = require('../utils/requestUtils');

const sendResult = (res, result, successStatus = 200) => {
  if (result.error) {
    const status = result.error.status || (result.error.code === 'PGRST116' ? 404 : 400);
    return res.status(status).json({ error: result.error.message, code: result.error.code });
  }

  return res.status(successStatus).json(result.data);
};

const create = async (req, res) => {
  const missing = validateRequired(req.body, ['patient_id', 'doctor_id', 'treatment_id', 'medicines', 'dosage']);

  if (missing.length > 0) {
    return res.status(422).json({ error: 'Missing required fields', fields: missing });
  }

  if (req.body.doctor_id !== req.user.id) {
    return res.status(403).json({ error: 'doctor_id must match the logged-in doctor' });
  }

  const result = await prescriptionService.create({
    patient_id: req.body.patient_id,
    doctor_id: req.body.doctor_id,
    treatment_id: req.body.treatment_id,
    medicines: req.body.medicines,
    dosage: req.body.dosage,
    instructions: req.body.instructions,
  });

  return sendResult(res, result, 201);
};

const getByPatientId = async (req, res) => {
  const result = await prescriptionService.listByPatientId(req.params.patient_id);
  return sendResult(res, result);
};

const getByTreatmentId = async (req, res) => {
  const result = await prescriptionService.getByTreatmentId(req.params.id);
  return sendResult(res, result);
};

const downloadPdf = async (req, res) => {
  const result = await pdfService.generatePrescriptionPdf(req.params.id);

  if (result.error) {
    return sendResult(res, result);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${result.data.filename}"`);
  return res.send(result.data.buffer);
};

module.exports = { create, downloadPdf, getByPatientId, getByTreatmentId };
