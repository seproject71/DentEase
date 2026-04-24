const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const requireDb = require('../middleware/requireDb');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/summary',
  requireDb,
  authMiddleware,
  authorizeRoles('admin', 'doctor'),
  asyncHandler(dashboardController.getSummary)
);

module.exports = router;
