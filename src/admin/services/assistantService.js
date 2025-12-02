const assistantRepository = require('../repositories/assistantRepository');
const userRepository = require('../repositories/userRepository');
const axios = require('axios');

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';

/**
 * Assistant Service
 * Handles business logic for assistants
 */
class AssistantService {
  /**
   * Helper: Convert camelCase to snake_case for Bolna API
   */
  camelToSnake(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.camelToSnake(item));
    }
    
    const snakeObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeObj[snakeKey] = this.camelToSnake(obj[key]);
      }
    }
    return snakeObj;
  }

  /**
   * Create assistant in Bolna AI
   */
  async createInBolnaAI(assistantData, bearerToken) {
    // Build llm_config from assistantData - use exact values from frontend
    const llmConfig = {
      agent_flow_type: assistantData.llmConfig.agent_flow_type,
      provider: assistantData.llmConfig.provider,
      family: assistantData.llmConfig.family,
      model: assistantData.llmConfig.model,
      temperature: assistantData.llmConfig.temperature,
      max_tokens: assistantData.llmConfig.max_tokens,
      top_p: assistantData.llmConfig.top_p,
      min_p: assistantData.llmConfig.min_p,
      top_k: assistantData.llmConfig.top_k,
      presence_penalty: assistantData.llmConfig.presence_penalty,
      frequency_penalty: assistantData.llmConfig.frequency_penalty,
      request_json: assistantData.llmConfig.request_json
    };

    // Build Bolna API v2 payload - use exact values from frontend
    const bolnaPayload = {
      agent_config: {
        agent_name: assistantData.agentName,
        agent_welcome_message: assistantData.agentWelcomeMessage,
        webhook_url: assistantData.webhookUrl || null,
        agent_type: assistantData.agentType,
        tasks: [{
          task_id: 'task_1',
          task_type: 'conversation',
          tools_config: {
            llm_agent: {
              agent_type: 'simple_llm_agent',
              agent_flow_type: llmConfig.agent_flow_type,
              llm_config: llmConfig
            },
            synthesizer: {
              provider: assistantData.synthesizerConfig.provider,
              provider_config: assistantData.synthesizerConfig.provider_config,
              stream: assistantData.synthesizerConfig.stream,
              buffer_size: assistantData.synthesizerConfig.buffer_size,
              audio_format: assistantData.synthesizerConfig.audio_format
            },
            transcriber: {
              provider: assistantData.transcriberConfig.provider,
              model: assistantData.transcriberConfig.model,
              language: assistantData.transcriberConfig.language,
              stream: assistantData.transcriberConfig.stream,
              sampling_rate: assistantData.transcriberConfig.sampling_rate,
              encoding: assistantData.transcriberConfig.encoding,
              endpointing: assistantData.transcriberConfig.endpointing
            },
            input: {
              provider: assistantData.inputConfig.provider,
              format: assistantData.inputConfig.format
            },
            output: {
              provider: assistantData.outputConfig.provider,
              format: assistantData.outputConfig.format
            }
          },
          toolchain: {
            execution: 'parallel',
            pipelines: [['transcriber', 'llm', 'synthesizer']]
          },
          task_config: {
            hangup_after_silence: assistantData.taskConfig.hangup_after_silence,
            incremental_delay: assistantData.taskConfig.incremental_delay,
            number_of_words_for_interruption: assistantData.taskConfig.number_of_words_for_interruption,
            backchanneling: assistantData.taskConfig.backchanneling,
            call_terminate: assistantData.taskConfig.call_terminate
          }
        }]
      },
      agent_prompts: {
        task_1: {
          system_prompt: assistantData.systemPrompt
        }
      }
    };


    const response = await axios.post(
      `${BOLNA_API_URL}/v2/agent`,
      bolnaPayload,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Patch update assistant in Bolna AI
   */
  async patchInBolnaAI(agentId, updateData, bearerToken) {
    const bolnaPatchPayload = {};
    const agentConfigUpdates = {};

    // Only updatable fields according to Bolna API docs
    if (updateData.agentName !== undefined) {
      agentConfigUpdates.agent_name = updateData.agentName;
    }
    
    if (updateData.agentWelcomeMessage !== undefined) {
      agentConfigUpdates.agent_welcome_message = updateData.agentWelcomeMessage;
    }
    
    if (updateData.webhookUrl !== undefined) {
      agentConfigUpdates.webhook_url = updateData.webhookUrl || null;
    }

    if (updateData.synthesizerConfig) {
      agentConfigUpdates.synthesizer = this.camelToSnake(updateData.synthesizerConfig);
    }

    if (Object.keys(agentConfigUpdates).length > 0) {
      bolnaPatchPayload.agent_config = agentConfigUpdates;
    }

    if (updateData.systemPrompt !== undefined) {
      bolnaPatchPayload.agent_prompts = {
        task_1: {
          system_prompt: updateData.systemPrompt
        }
      };
    }

    if (Object.keys(bolnaPatchPayload).length === 0) {
      throw new Error('No valid fields to update');
    }


    const response = await axios.patch(
      `${BOLNA_API_URL}/v2/agent/${agentId}`,
      bolnaPatchPayload,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Delete assistant from Bolna AI
   */
  async deleteFromBolnaAI(agentId, bearerToken) {
    const response = await axios.delete(
      `${BOLNA_API_URL}/v2/agent/${agentId}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Create assistant (Bolna first, then database)
   */
  async createAssistant(assistantData, adminId) {
    // Get user's bearer token
    const user = await userRepository.findById(assistantData.userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    if (!user.bearerToken) {
      const error = new Error('User bearer token not configured');
      error.status = 400;
      throw error;
    }

    // Step 1: Create in Bolna AI first
    const bolnaResponse = await this.createInBolnaAI(assistantData, user.bearerToken);

    // Step 2: Save to database with Bolna agent ID
    const dbData = {
      ...assistantData,
      agentId: bolnaResponse.agent_id,
      status: 'active',
      bolnaResponse: bolnaResponse,
      createdBy: adminId
    };

    const assistant = await assistantRepository.create(dbData);
    
    return assistant;
  }

  /**
   * Patch update assistant (Bolna first, then database)
   */
  async patchAssistant(id, updateData, adminId) {
    // Get assistant with user data
    const assistant = await assistantRepository.findByIdWithUser(id);

    if (!assistant || assistant.status === 'deleted') {
      const error = new Error('Assistant not found');
      error.status = 404;
      throw error;
    }

    if (!assistant.userId?.bearerToken) {
      const error = new Error('User bearer token not found');
      error.status = 400;
      throw error;
    }

    // Step 1: Update in Bolna AI first (if agentId exists)
    if (assistant.agentId) {
      try {
        await this.patchInBolnaAI(assistant.agentId, updateData, assistant.userId.bearerToken);
      } catch (bolnaError) {
        console.error('❌ Bolna AI update failed:', bolnaError.response?.data || bolnaError.message);
        const error = new Error('Failed to update assistant in Bolna AI');
        error.status = 500;
        error.details = bolnaError.response?.data || bolnaError.message;
        throw error;
      }
    }

    // Step 2: Update database (only if Bolna succeeded)
    const updateFields = {
      ...updateData,
      lastModifiedBy: adminId
    };

    const updatedAssistant = await assistantRepository.update(id, updateFields);
    
    return updatedAssistant;
  }

  /**
   * Get all assistants with filters and pagination
   */
  async getAllAssistants(filters = {}) {
    const assistants = await assistantRepository.findAll(filters);
    const total = await assistantRepository.countAssistants(filters);
    
    return {
      assistants,
      total,
      page: filters.page || 1,
      limit: Math.min(filters.limit || 10, 100) // Limit maximum to 100 items per page
    };
  }

  /**
   * Get assistant by ID
   */
  async getAssistantById(id) {
    const assistant = await assistantRepository.findById(id);
    
    if (!assistant || assistant.status === 'deleted') {
      const error = new Error('Assistant not found');
      error.status = 404;
      throw error;
    }

    return assistant;
  }

  /**
   * Get assistants by user
   */
  async getAssistantsByUser(userId) {
    return await assistantRepository.findByUser(userId);
  }

  /**
   * Delete assistant (Bolna first, then database)
   */
  async deleteAssistant(id) {
    const assistant = await assistantRepository.findByIdWithUser(id);

    if (!assistant || assistant.status === 'deleted') {
      const error = new Error('Assistant not found');
      error.status = 404;
      throw error;
    }

    // Step 1: Delete from Bolna AI first (if agentId exists)
    if (assistant.agentId && assistant.userId?.bearerToken) {
      try {
        await this.deleteFromBolnaAI(assistant.agentId, assistant.userId.bearerToken);
      } catch (bolnaError) {
        console.error('❌ Bolna AI delete failed:', bolnaError.response?.data || bolnaError.message);
        const error = new Error('Failed to delete assistant from Bolna AI');
        error.status = 500;
        error.details = bolnaError.response?.data || bolnaError.message;
        throw error;
      }
    }

    // Step 2: Delete from database (only if Bolna succeeded)
    await assistantRepository.delete(id);
    
    return { message: 'Assistant deleted successfully' };
  }
}

module.exports = new AssistantService();
