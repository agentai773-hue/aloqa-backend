/**
 * Static Agent Categories Configuration
 * Predefined agent types with default configurations for Bolna AI
 */

const agentCategories = {
  sales: {
    name: 'Sales Agent',
    description: 'AI agent optimized for sales calls and lead qualification',
    agentType: 'sales',
    defaultConfig: {
      agentWelcomeMessage: 'Hello! Thank you for your interest. How can I help you today?',
      systemPrompt: `You are a professional sales representative. Your goal is to:
1. Understand the customer's needs and pain points
2. Present relevant product/service benefits
3. Handle objections professionally
4. Guide the conversation towards closing
5. Maintain a friendly, helpful, and professional tone

Always listen carefully and provide value in every interaction.`,
      llmConfig: {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 200,
        temperature: 0.7,
        topP: 0.9
      },
      synthesizerConfig: {
        provider: 'elevenlabs',
        voice: 'Matthew',
        language: 'en-US',
        engine: 'generative'
      },
      transcriberConfig: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      taskConfig: {
        hangupAfterSilence: 15,
        callTerminate: 300,
        backchanneling: true,
        ambientNoise: false
      }
    },
    suggestedRoutes: [
      {
        routeName: 'pricing_inquiry',
        utterances: [
          'How much does it cost?',
          'What is the price?',
          'Can you tell me about pricing?'
        ],
        response: 'I\'d be happy to discuss our pricing options. Can you tell me more about your specific needs?',
        scoreThreshold: 0.85
      },
      {
        routeName: 'not_interested',
        utterances: [
          'I\'m not interested',
          'Please don\'t call again',
          'Remove me from your list'
        ],
        response: 'I completely understand. I\'ll make sure to update our records. Thank you for your time.',
        scoreThreshold: 0.9
      }
    ]
  },

  support: {
    name: 'Customer Support Agent',
    description: 'AI agent for handling customer support inquiries and issues',
    agentType: 'support',
    defaultConfig: {
      agentWelcomeMessage: 'Hello! Welcome to customer support. How can I assist you today?',
      systemPrompt: `You are a helpful customer support representative. Your responsibilities include:
1. Understanding customer issues clearly
2. Providing accurate solutions and troubleshooting steps
3. Escalating complex issues when necessary
4. Maintaining empathy and patience
5. Following up to ensure resolution

Always prioritize customer satisfaction and clear communication.`,
      llmConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 250,
        temperature: 0.3,
        topP: 0.9
      },
      synthesizerConfig: {
        provider: 'polly',
        voice: 'Joanna',
        language: 'en-US',
        engine: 'neural'
      },
      transcriberConfig: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      taskConfig: {
        hangupAfterSilence: 20,
        callTerminate: 600,
        backchanneling: true,
        ambientNoise: false
      }
    },
    suggestedRoutes: [
      {
        routeName: 'technical_issue',
        utterances: [
          'It\'s not working',
          'I have a technical problem',
          'Something is broken'
        ],
        response: 'I understand you\'re experiencing a technical issue. Let me help you troubleshoot this. Can you describe what\'s happening?',
        scoreThreshold: 0.85
      },
      {
        routeName: 'refund_request',
        utterances: [
          'I want a refund',
          'Can I get my money back?',
          'Request a refund'
        ],
        response: 'I\'ll be happy to help you with your refund request. Let me get some details to process this for you.',
        scoreThreshold: 0.9
      }
    ]
  },

  appointment: {
    name: 'Appointment Scheduler',
    description: 'AI agent for scheduling and managing appointments',
    agentType: 'appointment',
    defaultConfig: {
      agentWelcomeMessage: 'Hello! I can help you schedule an appointment. What date and time works best for you?',
      systemPrompt: `You are an appointment scheduling assistant. Your tasks include:
1. Understanding customer's preferred date and time
2. Checking availability
3. Confirming appointment details
4. Sending reminders
5. Handling rescheduling requests

Be efficient, clear, and accommodating with scheduling requests.`,
      llmConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.2,
        topP: 0.9
      },
      synthesizerConfig: {
        provider: 'polly',
        voice: 'Matthew',
        language: 'en-US',
        engine: 'generative'
      },
      transcriberConfig: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      taskConfig: {
        hangupAfterSilence: 12,
        callTerminate: 180,
        backchanneling: false,
        ambientNoise: false
      }
    },
    suggestedRoutes: [
      {
        routeName: 'reschedule',
        utterances: [
          'I need to reschedule',
          'Can I change my appointment?',
          'Move my appointment'
        ],
        response: 'Of course! Let me help you reschedule. What date and time would work better for you?',
        scoreThreshold: 0.9
      },
      {
        routeName: 'cancel',
        utterances: [
          'I need to cancel',
          'Cancel my appointment',
          'I can\'t make it'
        ],
        response: 'I understand. I\'ll cancel your appointment. Would you like to schedule a new one for a later date?',
        scoreThreshold: 0.9
      }
    ]
  },

  survey: {
    name: 'Survey Agent',
    description: 'AI agent for conducting surveys and collecting feedback',
    agentType: 'survey',
    defaultConfig: {
      agentWelcomeMessage: 'Hello! I\'d like to ask you a few quick questions for a survey. It will only take a few minutes.',
      systemPrompt: `You are conducting a customer survey. Your objectives are:
1. Ask survey questions clearly and concisely
2. Record responses accurately
3. Keep the survey brief and engaging
4. Thank participants for their time
5. Maintain a neutral, professional tone

Follow the survey script while remaining conversational.`,
      llmConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.1,
        topP: 0.8
      },
      synthesizerConfig: {
        provider: 'polly',
        voice: 'Joanna',
        language: 'en-US',
        engine: 'neural'
      },
      transcriberConfig: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      taskConfig: {
        hangupAfterSilence: 10,
        callTerminate: 240,
        backchanneling: false,
        ambientNoise: false
      }
    },
    suggestedRoutes: [
      {
        routeName: 'decline_survey',
        utterances: [
          'I don\'t have time',
          'Not interested in survey',
          'Can\'t do this right now'
        ],
        response: 'I completely understand. Thank you for your time. Have a great day!',
        scoreThreshold: 0.85
      }
    ]
  },

  other: {
    name: 'Custom Agent',
    description: 'Customizable AI agent for specific use cases',
    agentType: 'other',
    defaultConfig: {
      agentWelcomeMessage: 'Hello! How can I help you today?',
      systemPrompt: 'You are a helpful AI assistant. Provide accurate, concise, and professional responses to user queries.',
      llmConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.5,
        topP: 0.9
      },
      synthesizerConfig: {
        provider: 'polly',
        voice: 'Matthew',
        language: 'en-US',
        engine: 'generative'
      },
      transcriberConfig: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en'
      },
      taskConfig: {
        hangupAfterSilence: 10,
        callTerminate: 180,
        backchanneling: false,
        ambientNoise: false
      }
    },
    suggestedRoutes: []
  }
};

/**
 * Get all agent categories
 */
const getAllCategories = () => {
  return Object.keys(agentCategories).map(key => ({
    id: key,
    ...agentCategories[key]
  }));
};

/**
 * Get specific category configuration
 */
const getCategoryConfig = (categoryId) => {
  return agentCategories[categoryId] || agentCategories.other;
};

/**
 * Get default configuration for a category
 */
const getDefaultConfig = (categoryId) => {
  const category = agentCategories[categoryId] || agentCategories.other;
  return category.defaultConfig;
};

module.exports = {
  agentCategories,
  getAllCategories,
  getCategoryConfig,
  getDefaultConfig
};
