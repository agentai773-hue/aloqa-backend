const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  agentId: {
    type: String,
    unique: true,
    sparse: true,
    comment: 'Bolna AI agent ID returned after creation'
  },
  agentName: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
    maxlength: [100, 'Agent name cannot exceed 100 characters']
  },
  agentType: {
    type: String,
    required: [true, 'Agent type is required'],
    enum: [
      'conversation', 
      'webhook', 
      'other',
      'recruitment',
      'customer_support',
      'cart_abandonment',
      'lead_qualification',
      'onboarding',
      'front_desk',
      'cod_confirmation',
      'announcements',
      'reminders',
      'surveys',
      'property_tech',
      'Summarization',
      'Extraction'
    ],
    default: 'conversation'
  },
  agentWelcomeMessage: {
    type: String,
    trim: true,
    default: 'Hello! How can I help you today?'
  },
  webhookUrl: {
    type: String,
    trim: true,
    default: null
  },
  
  // LLM Configuration
  llmConfig: {
    agent_flow_type: {
      type: String,
      default: 'streaming',
      enum: ['streaming', 'non-streaming']
    },
    provider: {
      type: String,
      default: 'openai',
      enum: ['openai', 'openrouter', 'azure', 'deepseek', 'anthropic', 'groq', 'together']
    },
    family: {
      type: String,
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-4o-mini',
      enum: [
        // OpenAI models
        'gpt-4.1',
        'gpt-4.1-nano', 
        'gpt-4.1-mini',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        // Openrouter models
        'gpt-oss-20b',
        'gpt-oss-120b',
        'Claude sonnet-4',
        // Azure cluster models
        'gpt-4.1-mini cluster',
        'gpt-4.1 cluster',
        'gpt-4.1-nano cluster',
        'gpt-4o-mini cluster',
        'gpt-4o cluster',
        'gpt-4 cluster',
        'gpt-3.5 cluster',
        // Deepseek models
        'deepseek-chat'
      ]
    },
    max_tokens: {
      type: Number,
      default: 80,
      min: 0,
      max: 4000
    },
    temperature: {
      type: Number,
      default: 0.2,
      min: 0,
      max: 2
    },
    top_p: {
      type: Number,
      default: 0.9,
      min: 0,
      max: 1
    },
    min_p: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1
    },
    top_k: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    },
    presence_penalty: {
      type: Number,
      default: 0,
      min: -2,
      max: 2
    },
    frequency_penalty: {
      type: Number,
      default: 0,
      min: -2,
      max: 2
    },
    request_json: {
      type: Boolean,
      default: true
    }
  },
  
  // Synthesizer Configuration (Text-to-Speech)
  synthesizerConfig: {
    provider: {
      type: String,
      default: 'polly',
      enum: ['polly', 'elevenlabs', 'elevenlab', 'deepgram', 'xtts']
    },
    provider_config: {
      voice: {
        type: String,
        default: 'Kajal'
      },
      voice_id: {
        type: String,
        default: null,
        comment: 'ElevenLabs voice ID for voice cloning (optional)'
      },
      engine: {
        type: String,
        default: 'neural',
        enum: ['neural', 'generative', 'standard']
      },
      sampling_rate: {
        type: String,
        default: '8000'
      },
      language: {
        type: String,
        default: 'hi-IN'
      },
      model: {
        type: String,
        default: null,
        comment: 'ElevenLabs model (e.g., eleven_turbo_v2_5)'
      }
    },
    stream: {
      type: Boolean,
      default: true
    },
    buffer_size: {
      type: Number,
      default: 60
    },
    audio_format: {
      type: String,
      default: 'wav',
      enum: ['wav', 'mp3']
    }
  },
  
  // Transcriber Configuration (Speech-to-Text)
  transcriberConfig: {
    provider: {
      type: String,
      default: 'deepgram',
      enum: ['deepgram', 'whisper', 'azure', 'google', 'sarvam']
    },
    model: {
      type: String,
      default: 'nova-2'
    },
    language: {
      type: String,
      default: 'hi'
    },
    stream: {
      type: Boolean,
      default: true
    },
    sampling_rate: {
      type: Number,
      default: 16000,
      min: 1000,
      max: 48000
    },
    encoding: {
      type: String,
      default: 'linear16'
    },
    endpointing: {
      type: Number,
      default: 250,
      min: 0,
      max: 1000
    }
  },
  
  // Input/Output Configuration
  inputConfig: {
    provider: {
      type: String,
      default: 'plivo',
      enum: ['plivo', 'exotel', 'twilio']
    },
    format: {
      type: String,
      default: 'wav',
      enum: ['wav', 'mp3']
    }
  },
  outputConfig: {
    provider: {
      type: String,
      default: 'plivo',
      enum: ['plivo', 'exotel', 'twilio']
    },
    format: {
      type: String,
      default: 'wav',
      enum: ['wav', 'mp3']
    }
  },
  
  // Task Configuration
  taskConfig: {
    hangup_after_silence: {
      type: Number,
      default: 6,
      min: 0,
      max: 10,
      comment: 'Seconds of silence before hanging up'
    },
    call_terminate: {
      type: Number,
      default: 800,
      comment: 'Maximum call duration in seconds'
    },
    incremental_delay: {
      type: Number,
      default: 40,
      min: 10,
      max: 2000,
      comment: 'Incremental delay in milliseconds'
    },
    number_of_words_for_interruption: {
      type: Number,
      default: 2,
      min: 1,
      max: 10,
      comment: 'Number of words for interruption'
    },
    backchanneling: {
      type: Boolean,
      default: false
    },
    ambient_noise: {
      type: Boolean,
      default: false
    },
    hangup_after_llm_call: {
      type: Boolean,
      default: false
    },
    call_cancellation_prompt: {
      type: String,
      default: null
    },
    backchanneling_message_gap: {
      type: Number,
      default: 5
    },
    backchanneling_start_delay: {
      type: Number,
      default: 5
    },
    ambient_noise_track: {
      type: String,
      default: 'office-ambience'
    },
    voicemail: {
      type: Boolean,
      default: false
    },
    inbound_limit: {
      type: Number,
      default: -1
    },
    whitelist_phone_numbers: [{
      type: String
    }],
    disallow_unknown_numbers: {
      type: Boolean,
      default: false
    }
  },
  
  // System Prompt
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
    trim: true
  },
  
  // Routes for routing agent
  routes: [{
    routeName: {
      type: String,
      required: true
    },
    utterances: [{
      type: String
    }],
    response: {
      type: String,
      required: true
    },
    scoreThreshold: {
      type: Number,
      default: 0.9,
      min: 0,
      max: 1
    }
  }],
  
  // Voice Assignment Fields (for user-assigned voices)
  voiceId: {
    type: String,
    trim: true,
    comment: 'Voice ID from user voice assignments (ElevenLabs voice ID)'
  },
  voiceName: {
    type: String,
    trim: true,
    comment: 'Voice name from user voice assignments'
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'deleted'],
    default: 'draft'
  },
  
  // Bolna API Response
  bolnaResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
assistantSchema.index({ userId: 1, status: 1 });
assistantSchema.index({ agentType: 1 });
assistantSchema.index({ createdAt: -1 });

// Virtual for user details
assistantSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to find by user
assistantSchema.statics.findByUser = function(userId) {
  return this.find({ userId, status: { $ne: 'deleted' } })
    .populate('userId', 'firstName lastName email bearerToken')
    .sort({ createdAt: -1 });
};

// Static method to find active assistants
assistantSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Assistant', assistantSchema);
