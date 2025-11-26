const Assistant = require('../../models/Assistant');
const User = require('../../models/User');
const axios = require('axios');

/**
 * Helper function to convert camelCase object keys to snake_case for Bolna API
 */
const camelToSnake = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }
  
  const snakeObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = camelToSnake(obj[key]);
    }
  }
  return snakeObj;
};

/**
 * Create a new assistant and register with Bolna AI
 */
exports.createAssistant = async (req, res) => {
  try {
    const {
      userId,
      agentName,
      agentType,
      agentWelcomeMessage,
      webhookUrl,
      systemPrompt,
      llmConfig,
      synthesizerConfig,
      transcriberConfig,
      taskConfig,
      inputConfig,
      outputConfig,
      routes
    } = req.body;

    // ===== VALIDATION SECTION =====
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!agentName || agentName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Agent name is required'
      });
    }

    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'Agent type is required'
      });
    }

    if (!agentWelcomeMessage || agentWelcomeMessage.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Agent welcome message is required'
      });
    }

    if (!systemPrompt || systemPrompt.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'System prompt is required'
      });
    }

    // Validate LLM configuration
    if (!llmConfig || typeof llmConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'LLM configuration is required'
      });
    }

    if (!llmConfig.provider || !llmConfig.model) {
      return res.status(400).json({
        success: false,
        message: 'LLM provider and model are required'
      });
    }

    // Validate Synthesizer configuration
    if (!synthesizerConfig || typeof synthesizerConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Synthesizer configuration is required'
      });
    }

    if (!synthesizerConfig.provider || !synthesizerConfig.providerConfig) {
      return res.status(400).json({
        success: false,
        message: 'Synthesizer provider and configuration are required'
      });
    }

    // Validate Transcriber configuration
    if (!transcriberConfig || typeof transcriberConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Transcriber configuration is required'
      });
    }

    if (!transcriberConfig.provider || !transcriberConfig.model) {
      return res.status(400).json({
        success: false,
        message: 'Transcriber provider and model are required'
      });
    }

    // Validate Task configuration
    if (!taskConfig || typeof taskConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Task configuration is required'
      });
    }

    if (taskConfig.hangupAfterSilence === undefined || taskConfig.callTerminate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Task configuration must include hangupAfterSilence and callTerminate'
      });
    }

    // Validate user exists and has bearer token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.bearerToken) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a Bolna AI bearer token configured'
      });
    }

    // Validate user is approved
    if (user.isApproval !== 1) {
      return res.status(400).json({
        success: false,
        message: 'User is not approved yet'
      });
    }

    // ===== END VALIDATION SECTION =====

    // Create assistant in database first
    const assistant = new Assistant({
      userId,
      agentName,
      agentType,
      agentWelcomeMessage,
      webhookUrl,
      systemPrompt,
      llmConfig,
      synthesizerConfig,
      transcriberConfig,
      taskConfig,
      inputConfig,
      outputConfig,
      routes: routes || [],
      createdBy: req.admin._id,
      status: 'draft'
    });

    await assistant.save();

    // Convert all camelCase configs to snake_case for Bolna API
    const llmConfigSnake = camelToSnake(llmConfig);
    const synthesizerConfigSnake = camelToSnake(synthesizerConfig);
    const transcriberConfigSnake = camelToSnake(transcriberConfig);
    const taskConfigSnake = camelToSnake(taskConfig);
    const inputConfigSnake = camelToSnake(inputConfig);
    const outputConfigSnake = camelToSnake(outputConfig);

    // Prepare Bolna AI API request
    const bolnaPayload = {
      agent_config: {
        agent_name: agentName,
        agent_welcome_message: agentWelcomeMessage,
        webhook_url: webhookUrl || null,
        agent_type: agentType,
        tasks: [{
          task_id: 'task_1',
          task_type: 'conversation',
          tools_config: {
            llm_agent: {
              agent_type: llmConfigSnake.agent_type || 'simple_llm_agent',
              agent_flow_type: llmConfigSnake.agent_flow_type || 'streaming',
              llm_config: {
                agent_flow_type: llmConfigSnake.agent_flow_type || 'streaming',
                provider: llmConfigSnake.provider,
                family: llmConfigSnake.family || llmConfigSnake.provider,
                model: llmConfigSnake.model,
                temperature: llmConfigSnake.temperature,
                max_tokens: llmConfigSnake.max_tokens,
                top_p: llmConfigSnake.top_p,
                min_p: llmConfigSnake.min_p || 0.1,
                top_k: llmConfigSnake.top_k || 0,
                presence_penalty: llmConfigSnake.presence_penalty || 0,
                frequency_penalty: llmConfigSnake.frequency_penalty || 0,
                request_json: llmConfigSnake.request_json !== false
              }
            },
            synthesizer: {
              provider: synthesizerConfigSnake.provider,
              provider_config: {
                voice: synthesizerConfigSnake.provider_config.voice,
                engine: synthesizerConfigSnake.provider_config.engine,
                sampling_rate: synthesizerConfigSnake.provider_config.sampling_rate || '8000',
                language: synthesizerConfigSnake.provider_config.language
              },
              stream: synthesizerConfigSnake.stream !== false,
              buffer_size: synthesizerConfigSnake.buffer_size || 60,
              audio_format: synthesizerConfigSnake.audio_format || 'wav'
            },
            transcriber: {
              provider: transcriberConfigSnake.provider,
              model: transcriberConfigSnake.model,
              language: transcriberConfigSnake.language,
              stream: transcriberConfigSnake.stream !== false,
              sampling_rate: transcriberConfigSnake.sampling_rate || 16000,
              encoding: transcriberConfigSnake.encoding || 'linear16',
              endpointing: transcriberConfigSnake.endpointing || 250
            },
            input: {
              provider: inputConfigSnake?.provider || 'plivo',
              format: inputConfigSnake?.format || 'wav'
            },
            output: {
              provider: outputConfigSnake?.provider || 'plivo',
              format: outputConfigSnake?.format || 'wav'
            }
          },
          toolchain: {
            execution: 'parallel',
            pipelines: [['transcriber', 'llm', 'synthesizer']]
          },
          task_config: {
            hangup_after_silence: taskConfigSnake.hangup_after_silence,
            incremental_delay: taskConfigSnake.incremental_delay,
            number_of_words_for_interruption: taskConfigSnake.number_of_words_for_interruption,
            backchanneling: taskConfigSnake.backchanneling,
            call_terminate: taskConfigSnake.call_terminate
          }
        }]
      },
      agent_prompts: {
        task_1: {
          system_prompt: systemPrompt
        }
      }
    };

    // Add routes if provided
    if (routes && routes.length > 0) {
      bolnaPayload.agent_config.tasks[0].tools_config.llm_agent.routing_config = {
        embedding_model: 'snowflake/snowflake-arctic-embed-m',
        routes: routes.map(route => ({
          route_name: route.routeName,
          utterances: route.utterances,
          response: route.response,
          score_threshold: route.scoreThreshold
        }))
      };
    }

    try {
      // Call Bolna AI API
      const bolnaResponse = await axios.post(
        'https://api.bolna.ai/v2/agent',
        bolnaPayload,
        {
          headers: {
            'Authorization': `Bearer ${user.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update assistant with Bolna response
      assistant.agentId = bolnaResponse.data.agent_id;
      assistant.status = bolnaResponse.data.status === 'created' ? 'active' : 'draft';
      assistant.bolnaResponse = bolnaResponse.data;
      await assistant.save();

      res.status(201).json({
        success: true,
        message: 'Assistant created successfully',
        data: assistant,
        bolnaData: bolnaResponse.data
      });

    } catch (bolnaError) {
      console.error('Bolna AI API Error:', bolnaError.response?.data || bolnaError.message);
      
      // Update assistant with error status
      assistant.status = 'draft';
      assistant.bolnaResponse = {
        error: true,
        message: bolnaError.response?.data?.message || bolnaError.message,
        details: bolnaError.response?.data
      };
      await assistant.save();

      res.status(500).json({
        success: false,
        message: 'Assistant saved but failed to register with Bolna AI',
        error: bolnaError.response?.data?.message || bolnaError.message,
        data: assistant
      });
    }

  } catch (error) {
    console.error('Error creating assistant:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      message: 'Failed to create assistant',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get all assistants
 */
exports.getAllAssistants = async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    let query = { status: { $ne: 'deleted' } };
    
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const assistants = await Assistant.find(query)
      .populate('userId', 'firstName lastName email bearerToken')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assistants.length,
      data: assistants
    });
  } catch (error) {
    console.error('Error fetching assistants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assistants',
      error: error.message
    });
  }
};

/**
 * Get assistant by ID
 */
exports.getAssistantById = async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id)
      .populate('userId', 'firstName lastName email bearerToken')
      .populate('createdBy', 'username email');

    if (!assistant || assistant.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assistant
    });
  } catch (error) {
    console.error('Error fetching assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assistant',
      error: error.message
    });
  }
};

/**
 * Update assistant (PUT - full update to Bolna AI)
 */
exports.updateAssistantFull = async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id).populate('userId', 'bearerToken');

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }

    if (!assistant.userId?.bearerToken) {
      return res.status(400).json({
        success: false,
        message: 'User bearer token not found'
      });
    }

    const {
      agentName,
      agentType,
      agentWelcomeMessage,
      webhookUrl,
      systemPrompt,
      llmConfig,
      synthesizerConfig,
      transcriberConfig,
      taskConfig,
      inputConfig,
      outputConfig,
      routes
    } = req.body;

    // Update local database first
    const updateFields = [
      'agentName', 'agentType', 'agentWelcomeMessage', 'webhookUrl', 'systemPrompt',
      'llmConfig', 'synthesizerConfig', 'transcriberConfig', 'taskConfig', 'routes', 'status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        assistant[field] = req.body[field];
      }
    });

    assistant.lastModifiedBy = req.admin._id;
    await assistant.save();

    // Update in Bolna AI if agentId exists
    if (assistant.agentId) {
      try {
        const bolnaPayload = {
          agent_config: {
            agent_name: agentName || assistant.agentName,
            agent_welcome_message: agentWelcomeMessage || assistant.agentWelcomeMessage,
            webhook_url: webhookUrl || assistant.webhookUrl || null,
            agent_type: agentType || assistant.agentType || 'other',
            tasks: [{
              task_id: 'task_1',
              task_type: 'conversation',
              tools_config: {
                llm_agent: {
                  agent_type: 'simple_llm_agent',
                  agent_flow_type: llmConfig?.agent_flow_type || 'streaming',
                  llm_config: {
                    agent_flow_type: llmConfig?.agent_flow_type || 'streaming',
                    provider: llmConfig?.provider || 'openai',
                    family: llmConfig?.family || llmConfig?.provider || 'openai',
                    model: llmConfig?.model || 'gpt-4o-mini',
                    temperature: llmConfig?.temperature || 0.2,
                    max_tokens: llmConfig?.max_tokens || 80,
                    top_p: llmConfig?.top_p || 0.9,
                    min_p: llmConfig?.min_p || 0.1,
                    top_k: llmConfig?.top_k || 0,
                    presence_penalty: llmConfig?.presence_penalty || 0,
                    frequency_penalty: llmConfig?.frequency_penalty || 0,
                    request_json: true
                  },
                  routes: routes || []
                },
                synthesizer: {
                  provider: synthesizerConfig?.provider || 'polly',
                  provider_config: synthesizerConfig?.provider_config || {
                    voice: 'Kajal',
                    engine: 'neural',
                    sampling_rate: '8000',
                    language: 'hi-IN'
                  },
                  stream: true,
                  buffer_size: synthesizerConfig?.buffer_size || 60,
                  audio_format: synthesizerConfig?.audio_format || 'wav'
                },
                transcriber: {
                  provider: transcriberConfig?.provider || 'deepgram',
                  model: transcriberConfig?.model || 'nova-2',
                  language: transcriberConfig?.language || 'hi',
                  stream: true,
                  sampling_rate: transcriberConfig?.sampling_rate || 16000,
                  encoding: transcriberConfig?.encoding || 'linear16',
                  endpointing: transcriberConfig?.endpointing || 250
                },
                input: {
                  provider: inputConfig?.provider || 'plivo',
                  format: inputConfig?.format || 'wav'
                },
                output: {
                  provider: outputConfig?.provider || 'plivo',
                  format: outputConfig?.format || 'wav'
                }
              },
              toolchain: {
                execution: 'parallel',
                pipelines: [['transcriber', 'llm', 'synthesizer']]
              },
              task_config: {
                hangup_after_silence: taskConfig?.hangup_after_silence || 8,
                incremental_delay: taskConfig?.incremental_delay || 40,
                number_of_words_for_interruption: taskConfig?.number_of_words_for_interruption || 2,
                backchanneling: taskConfig?.backchanneling || false,
                call_terminate: taskConfig?.call_terminate || 800
              }
            }]
          },
          agent_prompts: {
            task_1: {
              system_prompt: systemPrompt || 'You are a helpful AI assistant.'
            }
          }
        };

        const bolnaResponse = await axios.put(
          `https://api.bolna.ai/v2/agent/${assistant.agentId}`,
          bolnaPayload,
          {
            headers: {
              'Authorization': `Bearer ${assistant.userId.bearerToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        res.status(200).json({
          success: true,
          message: 'Assistant updated successfully',
          data: assistant,
          bolnaData: bolnaResponse.data
        });

      } catch (bolnaError) {
        console.error('Bolna AI update error:', bolnaError.response?.data || bolnaError.message);
        res.status(500).json({
          success: false,
          message: 'Assistant updated in database but failed in Bolna AI',
          error: bolnaError.response?.data?.message || bolnaError.message
        });
      }
    } else {
      res.status(200).json({
        success: true,
        message: 'Assistant updated successfully',
        data: assistant
      });
    }

  } catch (error) {
    console.error('Error updating assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assistant',
      error: error.message
    });
  }
};

/**
 * Patch assistant (PATCH - partial update to Bolna AI)
 */
exports.patchAssistant = async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id).populate('userId', 'bearerToken');

    if (!assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }

    const {
      agentName,
      agentWelcomeMessage,
      webhookUrl,
      systemPrompt,
      synthesizerConfig
    } = req.body;

    // Update database
    if (agentName) assistant.agentName = agentName;
    if (agentWelcomeMessage) assistant.agentWelcomeMessage = agentWelcomeMessage;
    if (webhookUrl !== undefined) assistant.webhookUrl = webhookUrl;
    if (systemPrompt) assistant.systemPrompt = systemPrompt;
    if (synthesizerConfig) assistant.synthesizerConfig = { ...assistant.synthesizerConfig, ...synthesizerConfig };

    assistant.lastModifiedBy = req.admin._id;
    await assistant.save();

    // Patch in Bolna AI if agentId exists
    if (assistant.agentId && assistant.userId?.bearerToken) {
      try {
        const bolnaPayload = { agent_config: {}, agent_prompts: {} };

        if (agentName) bolnaPayload.agent_config.agent_name = agentName;
        if (agentWelcomeMessage) bolnaPayload.agent_config.agent_welcome_message = agentWelcomeMessage;
        if (webhookUrl !== undefined) bolnaPayload.agent_config.webhook_url = webhookUrl || null;
        if (synthesizerConfig) bolnaPayload.agent_config.synthesizer = synthesizerConfig;
        if (systemPrompt) bolnaPayload.agent_prompts.task_1 = { system_prompt: systemPrompt };

        await axios.patch(
          `https://api.bolna.ai/v2/agent/${assistant.agentId}`,
          bolnaPayload,
          {
            headers: {
              'Authorization': `Bearer ${assistant.userId.bearerToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (bolnaError) {
        console.error('Bolna AI patch error:', bolnaError.response?.data || bolnaError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Assistant patched successfully',
      data: assistant
    });

  } catch (error) {
    console.error('Error patching assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to patch assistant',
      error: error.message
    });
  }
};

/**
 * Update assistant (legacy - simple database update)
 */
exports.updateAssistant = async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id);

    if (!assistant || assistant.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }

    // Update fields
    const updateFields = [
      'agentName', 'agentWelcomeMessage', 'webhookUrl', 'systemPrompt',
      'llmConfig', 'synthesizerConfig', 'transcriberConfig', 'taskConfig', 'routes', 'status'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        assistant[field] = req.body[field];
      }
    });

    assistant.lastModifiedBy = req.admin._id;
    await assistant.save();

    res.status(200).json({
      success: true,
      message: 'Assistant updated successfully',
      data: assistant
    });
  } catch (error) {
    console.error('Error updating assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assistant',
      error: error.message
    });
  }
};

/**
 * Delete assistant (hard delete from Bolna AI first, then DB)
 */
exports.deleteAssistant = async (req, res) => {
  try {
    const assistant = await Assistant.findById(req.params.id).populate('userId', 'bearerToken');

    if (!assistant || assistant.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Assistant not found'
      });
    }

    // CRITICAL: Delete from Bolna AI FIRST to prevent orphaned records
    if (assistant.agentId && assistant.userId?.bearerToken) {
      try {
        await axios.delete(
          `https://api.bolna.ai/v2/agent/${assistant.agentId}`,
          {
            headers: {
              'Authorization': `Bearer ${assistant.userId.bearerToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`Successfully deleted agent ${assistant.agentId} from Bolna AI`);
      } catch (bolnaError) {
        console.error('Bolna AI delete error:', bolnaError.response?.data || bolnaError.message);
        // Return error - do NOT delete from DB if Bolna delete fails
        return res.status(500).json({
          success: false,
          message: 'Failed to delete assistant from Bolna AI. Database not modified.',
          error: bolnaError.response?.data || bolnaError.message
        });
      }
    }

    // Only delete from database if Bolna deletion succeeded
    await Assistant.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Assistant deleted successfully from Bolna AI and database'
    });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assistant',
      error: error.message
    });
  }
};

/**
 * Get assistants by user
 */
exports.getAssistantsByUser = async (req, res) => {
  try {
    const assistants = await Assistant.findByUser(req.params.userId);

    res.status(200).json({
      success: true,
      count: assistants.length,
      data: assistants
    });
  } catch (error) {
    console.error('Error fetching user assistants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user assistants',
      error: error.message
    });
  }
};
