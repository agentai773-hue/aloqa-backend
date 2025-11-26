// clients/controllers/assistantController.js
const AssistantService = require('../services/assistantService');

class AssistantController {
  constructor() {
    this.assistantService = new AssistantService();
  }

  /**
   * Get all assistants for authenticated user
   * GET /clients/assistants
   */
  async getAllAssistants(req, res) {
    try {
      const userId = req.user._id;

      const result = await this.assistantService.getAllAssistants(userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single assistant by ID
   * GET /clients/assistants/:id
   */
  async getAssistantById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await this.assistantService.getAssistantById(id, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = AssistantController;
