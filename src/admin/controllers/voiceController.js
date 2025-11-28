const voiceService = require('../services/voiceService');
const VoiceAssignment = require('../../models/VoiceAssignment');
const User = require('../../models/User');

/**
 * Get all voices from Bolna API
 */
const getVoices = async (req, res) => {
  try {
    const { provider, search, accent, sortBy = 'name', sortDirection = 'asc' } = req.query;
    
    // Build filter object
    const filters = {
      provider,
      search,
      accent,
      sortBy,
      sortDirection
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = await voiceService.searchVoices(filters);
    
    res.json({
      success: true,
      message: 'Voices retrieved successfully',
      data: {
        voices: result.data,
        total: result.total,
        filters: result.filters
      }
    });
  } catch (error) {
    console.error('Error in getVoices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve voices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get voice by ID from Bolna API
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
    
    res.json({
      success: true,
      message: 'Voice details retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getVoiceById:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to retrieve voice details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get voice providers from Bolna API
 */
const getVoiceProviders = async (req, res) => {
  try {
    const result = await voiceService.getVoiceProviders();
    
    res.json({
      success: true,
      message: 'Voice providers retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getVoiceProviders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve voice providers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get accent categories from Bolna API
 */
const getAccentCategories = async (req, res) => {
  try {
    const result = await voiceService.getAccentCategories();
    
    res.json({
      success: true,
      message: 'Voice accents retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getAccentCategories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve voice accents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Assign voice to user
 */
const assignVoice = async (req, res) => {
  try {
    const { voiceId, userId } = req.body;
    
    // Validate required fields
    if (!voiceId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Voice ID and User ID are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get voice details from Bolna API
    const voiceResult = await voiceService.getVoiceById(voiceId);
    const voice = voiceResult.data;

    // Check if voice is already assigned to this user
    const existingAssignment = await VoiceAssignment.findOne({ voiceId, userId, status: 'active' });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Voice is already assigned to this user'
      });
    }

    // Create voice assignment
    const assignment = new VoiceAssignment({
      voiceId: voice.voice_id,
      voiceName: voice.name,
      provider: voice.provider,
      model: voice.model,
      accent: voice.accent,
      userId
    });

    await assignment.save();

    // Populate user details
    await assignment.populate('userId', 'firstName lastName email companyName');
    
    res.json({
      success: true,
      message: 'Voice assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error in assignVoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign voice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get assigned voices for a user
 */
const getAssignedVoices = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Build query
    let query = { status: 'active' };
    if (userId) {
      query.userId = userId;
    }

    const assignments = await VoiceAssignment.find(query)
      .populate('userId', 'firstName lastName email companyName')
      .sort({ assignedAt: -1 });
    
    res.json({
      success: true,
      message: 'Assigned voices retrieved successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error in getAssignedVoices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve assigned voices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Unassign voice from user
 */
const unassignVoice = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await VoiceAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Voice assignment not found'
      });
    }

    // Update status to inactive instead of deleting
    assignment.status = 'inactive';
    await assignment.save();
    
    res.json({
      success: true,
      message: 'Voice unassigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error in unassignVoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unassign voice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getVoices,
  getVoiceById,
  getVoiceProviders,
  getAccentCategories,
  assignVoice,
  getAssignedVoices,
  unassignVoice
};