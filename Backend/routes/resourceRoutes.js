const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const invoiceController = require('../controllers/invoiceController');
const makeResourceController = require('../controllers/resourceController');
const paymentController = require('../controllers/paymentController');
const treatmentController = require('../controllers/treatmentController');
const requireDb = require('../middleware/requireDb');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeResourceAction } = require('../middleware/roleMiddleware');
const { resources } = require('../models/resourceModel');

const router = express.Router();

Object.entries(resources).forEach(([resource, options]) => {
  const specializedControllers = {
    appointments: appointmentController,
    invoices: invoiceController,
    payments: paymentController,
    treatments: treatmentController,
  };
  const controller = specializedControllers[resource] || makeResourceController(resource, options);
  const authorize = authorizeResourceAction(resource);

  router.get(`/${resource}`, requireDb, authMiddleware, authorize, asyncHandler(controller.list));
  router.get(`/${resource}/:id`, requireDb, authMiddleware, authorize, asyncHandler(controller.getById));
  router.post(`/${resource}`, requireDb, authMiddleware, authorize, asyncHandler(controller.create));
  router.put(`/${resource}/:id`, requireDb, authMiddleware, authorize, asyncHandler(controller.update));
  router.delete(`/${resource}/:id`, requireDb, authMiddleware, authorize, asyncHandler(controller.remove));
});

module.exports = router;
