const { validationResult } = require('express-validator');
const assistantService = require('../services/assistantService');

/**
 * Assistant Controller
 * Handles HTTP requests and responses
 */

/**
 * @desc    Create a new assistant
 * @route   POST /api/assistants
 * @access  Private (Admin only)
 */
exports.createAssistant = async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const assistant = await assistantService.createAssistant(req.body, req.admin._id);

    res.status(201).json({
      success: true,
      message: 'Assistant created successfully in Bolna AI and database',
      data: assistant
    });

  } catch (error) {
    console.error('❌ Create assistant error:', error);
    
    // Handle Bolna AI errors
    if (error.response?.data) {
      const bolnaError = error.response.data;
      let userFriendlyMessage = 'Failed to create assistant in Bolna AI';
      
      // Parse Bolna API error details for user-friendly messages
      if (bolnaError.detail) {
        const detail = bolnaError.detail;
        
        // Language not supported for model
        if (detail.includes('language') && detail.includes('not available')) {
          const langMatch = detail.match(/Given language: ([^\s]+)/);
          const modelMatch = detail.match(/model: ([^\s]+)/);
          const language = langMatch ? langMatch[1] : 'selected language';
          const model = modelMatch ? modelMatch[1] : 'selected model';
          userFriendlyMessage = `Language "${language}" is not supported by the transcriber model "${model}". Please select a different language or model combination.`;
        }
        // Voice not supported
        else if (detail.includes('voice') && detail.includes('not available')) {
          userFriendlyMessage = 'Selected voice is not available for the chosen provider. Please select a different voice.';
        }
        // Invalid configuration
        else if (detail.includes('Invalid') || detail.includes('invalid')) {
          userFriendlyMessage = `Invalid configuration: ${detail}`;
        }
        // Generic Bolna error
        else {
          userFriendlyMessage = `Bolna AI Error: ${detail}`;
        }
      }
      
      return res.status(error.response.status || 500).json({
        success: false,
        message: userFriendlyMessage,
        error: bolnaError,
        errorDetail: bolnaError.detail
      });
    }

    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to create assistant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all assistants with filters
 * @route   GET /api/assistants
 * @access  Private (Admin only)
 */
exports.getAllAssistants = async (req, res) => {
  try {
    const { userId, status, page, limit, search, agentType } = req.query;
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = Math.min(parseInt(limit), 100); // Limit max to 100
    if (search) filters.search = search.trim();
    if (agentType) filters.agentType = agentType;

    const result = await assistantService.getAllAssistants(filters);

    res.json({
      success: true,
      message: 'Assistants retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Get assistants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assistants',
      error: error.message
    });
  }
};

/**
 * @desc    Get assistant by ID
 * @route   GET /api/assistants/:id
 * @access  Private (Admin only)
 */
exports.getAssistantById = async (req, res) => {
  try {
    const assistant = await assistantService.getAssistantById(req.params.id);

    res.json({
      success: true,
      data: assistant
    });

  } catch (error) {
    console.error('❌ Get assistant error:', error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch assistant'
    });
  }
};

/**
 * @desc    Patch update assistant (Bolna first, then database)
 * @route   PATCH /api/assistants/:id
 * @access  Private (Admin only)
 */
exports.patchAssistant = async (req, res) => {
  try {
    const assistant = await assistantService.patchAssistant(
      req.params.id,
      req.body,
      req.admin._id
    );

    res.json({
      success: true,
      message: 'Assistant updated successfully in Bolna AI and database',
      data: assistant
    });

  } catch (error) {
    console.error('❌ Patch assistant error:', error);
    
    // Handle Bolna AI errors
    if (error.response?.data) {
      const bolnaError = error.response.data;
      let userFriendlyMessage = 'Failed to update assistant in Bolna AI';
      
      // Parse Bolna API error details for user-friendly messages
      if (bolnaError.detail) {
        const detail = bolnaError.detail;
        
        // Language not supported for model
        if (detail.includes('language') && detail.includes('not available')) {
          const langMatch = detail.match(/Given language: ([^\s]+)/);
          const modelMatch = detail.match(/model: ([^\s]+)/);
          const language = langMatch ? langMatch[1] : 'selected language';
          const model = modelMatch ? modelMatch[1] : 'selected model';
          userFriendlyMessage = `Language "${language}" is not supported by the transcriber model "${model}". Please select a different language or model combination.`;
        }
        // Voice not supported
        else if (detail.includes('voice') && detail.includes('not available')) {
          userFriendlyMessage = 'Selected voice is not available for the chosen provider. Please select a different voice.';
        }
        // Invalid configuration
        else if (detail.includes('Invalid') || detail.includes('invalid')) {
          userFriendlyMessage = `Invalid configuration: ${detail}`;
        }
        // Generic Bolna error
        else {
          userFriendlyMessage = `Bolna AI Error: ${detail}`;
        }
      }
      
      return res.status(error.response.status || 500).json({
        success: false,
        message: userFriendlyMessage,
        error: bolnaError,
        errorDetail: bolnaError.detail
      });
    }
    
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update assistant',
      error: error.details || (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
};

/**
 * @desc    Update assistant (legacy - simple database update)
 * @route   PUT /api/assistants/:id
 * @access  Private (Admin only)
 */
exports.updateAssistant = async (req, res) => {
  try {
    const assistant = await assistantService.patchAssistant(
      req.params.id,
      req.body,
      req.admin._id
    );

    res.json({
      success: true,
      message: 'Assistant updated successfully',
      data: assistant
    });

  } catch (error) {
    console.error('❌ Update assistant error:', error);
    
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update assistant',
      error: error.details || (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
};

/**
 * @desc    Delete assistant (Bolna first, then database)
 * @route   DELETE /api/assistants/:id
 * @access  Private (Admin only)
 */
exports.deleteAssistant = async (req, res) => {
  try {
    await assistantService.deleteAssistant(req.params.id);

    res.json({
      success: true,
      message: 'Assistant deleted successfully from Bolna AI and database'
    });

  } catch (error) {
    console.error('❌ Delete assistant error:', error);
    
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete assistant',
      error: error.details || (process.env.NODE_ENV === 'development' ? error.message : undefined)
    });
  }
};

/**
 * @desc    Get assistants by user
 * @route   GET /api/assistants/user/:userId
 * @access  Private (Admin only)
 */
exports.getAssistantsByUser = async (req, res) => {
  try {
    const assistants = await assistantService.getAssistantsByUser(req.params.userId);

    res.json({
      success: true,
      count: assistants.length,
      data: assistants
    });

  } catch (error) {
    console.error('❌ Get user assistants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user assistants',
      error: error.message
    });
  }
};

/**
 * @desc    Full update assistant (legacy - kept for backward compatibility)
 * @route   PUT /api/assistants/:id/full
 * @access  Private (Admin only)
 */
