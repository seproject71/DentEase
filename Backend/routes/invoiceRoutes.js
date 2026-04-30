const express = require('express');
const invoiceController = require('../controllers/invoiceController');
const requireDb = require('../middleware/requireDb');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/invoices', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.list));
router.get('/invoices/:id/pdf', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.downloadPdf));
router.get('/invoices/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.getById));
router.post('/invoices', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.create));
router.put('/invoices/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.update));
router.delete('/invoices/:id', requireDb, authMiddleware, authorizeRoles('admin', 'doctor'), asyncHandler(invoiceController.remove));

module.exports = router;
