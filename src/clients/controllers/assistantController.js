const Assistant = require('../../models/Assistant');

class AssistantController {
  // Get assistants for current user
  async getUserAssistants(req, res) {
    try {
      const userId = req.user.id;

      const assistants = await Assistant.find({ 
        userId: userId 
      }).select('_id agentId agentName agentType').sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Assistants fetched successfully',
        data: assistants
      });
    } catch (error) {
      console.error('❌ Get user assistants error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user assistants'
      });
    }
  }
}

module.exports = new AssistantController();