const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');

// GET /api/translations
router.get('/', translationController.getTranslations);

// POST /api/translations
router.post('/', translationController.createTranslation);

module.exports = router;