// clients/services/assistantService.js
const {
  getAssistantsByUserId,
  getAssistantById
} = require('../repositories/assistantRepository');

class AssistantService {
  /**
   * Get all assistants for user
   */
  async getAllAssistants(userId) {
    try {
      const assistants = await getAssistantsByUserId(userId);

      if (!assistants || assistants.length === 0) {
        return {
          success: true,
          message: 'No assistants found',
          data: []
        };
      }

      return {
        success: true,
        message: 'Assistants retrieved successfully',
        data: assistants
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get single assistant by ID
   */
  async getAssistantById(assistantId, userId) {
    try {
      const assistant = await getAssistantById(assistantId, userId);

      if (!assistant) {
        return {
          success: false,
          error: 'Assistant not found'
        };
      }

      return {
        success: true,
        message: 'Assistant retrieved successfully',
        data: assistant
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AssistantService;
