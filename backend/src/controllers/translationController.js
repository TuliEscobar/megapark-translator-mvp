const TranslationModel = require('../models/translationModel');

// @api-design-principles: Controladores aislados manejando req, res
const getTranslations = async (req, res, next) => {
  try {
    const translations = await TranslationModel.getAll(50);
    return res.status(200).json({ success: true, data: translations });
  } catch (error) {
    console.error('[TranslationController] Error getting translations:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const createTranslation = async (req, res, next) => {
  try {
    const { original_text, translated_text, source_language, target_language } = req.body;

    // Validación básica de parámetros (vital para @security-auditor)
    if (!original_text || !translated_text || !source_language || !target_language) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const newTranslation = await TranslationModel.create({
      original_text,
      translated_text,
      source_language,
      target_language
    });

    return res.status(201).json({ success: true, data: newTranslation });
  } catch (error) {
    console.error('[TranslationController] Error saving translation:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  getTranslations,
  createTranslation
};