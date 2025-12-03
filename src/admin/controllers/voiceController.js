const VoiceService = require('../services/voiceService');

const voiceService = new VoiceService();

/**
 * Get all voices
 */
const getVoices = async (req, res) => {
  try {
    const { provider } = req.query;

    let result;
    // If provider is specified and not empty, filter by provider
    // If provider is not provided or is empty string, get all voices
    if (provider && provider.trim() !== '') {
      result = await voiceService.getVoicesByProvider(provider);
    } else {
      result = await voiceService.getAllVoices();
    }

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        success: false,
        message: result.error,
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Voices fetched successfully',
      data: result.data,
      count: result.count || result.data.length
    });
  } catch (error) {
    console.error('Error in getVoices controller:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get voice by ID
 */
const getVoiceById = async (req, res) => {
  try {
    const { voiceId } = req.params;

    if (!voiceId) {
      return res.status(400).json({
        success: false,
        message: 'Voice ID is required'
      });
    }

    const result = await voiceService.getVoiceById(voiceId);

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        success: false,
        message: result.error,
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Voice fetched successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getVoiceById controller:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getVoices,
  getVoiceById
};