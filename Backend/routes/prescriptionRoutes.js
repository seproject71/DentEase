const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const requireDb = require('../middleware/requireDb');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/prescriptions',
  requireDb,
  authMiddleware,
  authorizeRoles('doctor'),
  asyncHandler(prescriptionController.create)
);

router.get(
  '/prescriptions/treatment/:id',
  requireDb,
  authMiddleware,
  asyncHandler(prescriptionController.getByTreatmentId)
);

router.get(
  '/prescriptions/:id/pdf',
  requireDb,
  authMiddleware,
  authorizeRoles('admin', 'doctor'),
  asyncHandler(prescriptionController.downloadPdf)
);

router.get(
  '/prescriptions/:patient_id',
  requireDb,
  authMiddleware,
  asyncHandler(prescriptionController.getByPatientId)
);

module.exports = router;
