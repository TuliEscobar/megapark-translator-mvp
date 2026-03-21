// Detectamos si estamos en desarrollo local o en producción (Render)
const API_URL = import.meta.env.DEV ? 'http://localhost:4000/api' : '/api';

export const saveTranslation = async ({ original_text, translated_text, source_language, target_language }) => {
  try {
    const response = await fetch(`${API_URL}/translations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_text,
        translated_text,
        source_language,
        target_language
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving translation:', error);
    return null;
  }
};

export const getTranslationHistory = async () => {
  try {
    const response = await fetch(`${API_URL}/translations`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};