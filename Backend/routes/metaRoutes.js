const express = require('express');
const metaController = require('../controllers/metaController');

const router = express.Router();

router.get('/', metaController.getApiIndex);
router.get('/health', metaController.getHealth);

module.exports = router;
