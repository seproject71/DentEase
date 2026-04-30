const express = require('express');
const paymentController = require('../controllers/paymentController');
const requireDb = require('../middleware/requireDb');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/payments', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(paymentController.list));
router.get('/payments/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(paymentController.getById));
router.post('/payments', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(paymentController.create));
router.put('/payments/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(paymentController.update));
router.delete('/payments/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(paymentController.remove));

module.exports = router;
