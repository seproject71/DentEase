const express = require('express');
const patientController = require('../controllers/patientController');
const requireDb = require('../middleware/requireDb');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/patients/:id/history',
  requireDb,
  authMiddleware,
  authorizeRoles('admin', 'doctor', 'receptionist'),
  asyncHandler(patientController.getHistory)
);

module.exports = router;
