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
    agentType: {
      type: String,
      default: 'simple_llm_agent',
      enum: ['simple_llm_agent']
    },
    agentFlowType: {
      type: String,
      default: 'streaming',
      enum: ['streaming', 'non-streaming']
    },
    provider: {
      type: String,
      default: 'openai',
      enum: ['openai', 'anthropic', 'groq', 'together']
    },
    family: {
      type: String,
      default: 'openai'
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo',
      enum: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo']
    },
    maxTokens: {
      type: Number,
      default: 100,
      min: 0,
      max: 4000
    },
    temperature: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 1
    },
    topP: {
      type: Number,
      default: 0.9,
      min: 0.1,
      max: 1
    },
    minP: {
      type: Number,
      default: 0.1,
      min: 0.1,
      max: 1
    },
    topK: {
      type: Number,
      default: 0,
      min: 0,
      max: 50
    },
    presencePenalty: {
      type: Number,
      default: 0
    },
    frequencyPenalty: {
      type: Number,
      default: 0
    },
    requestJson: {
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
    providerConfig: {
      voice: {
        type: String,
        default: 'Kajal'
      },
      engine: {
        type: String,
        default: 'neural',
        enum: ['neural', 'generative', 'standard']
      },
      samplingRate: {
        type: String,
        default: '8000'
      },
      language: {
        type: String,
        default: 'hi-IN'
      },
      model: {
        type: String,
        default: null
      }
    },
    stream: {
      type: Boolean,
      default: true
    },
    bufferSize: {
      type: Number,
      default: 60
    },
    audioFormat: {
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
    samplingRate: {
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
    hangupAfterSilence: {
      type: Number,
      default: 6,
      min: 0,
      max: 10,
      comment: 'Seconds of silence before hanging up'
    },
    callTerminate: {
      type: Number,
      default: 90,
      comment: 'Maximum call duration in seconds'
    },
    incrementalDelay: {
      type: Number,
      default: 400,
      min: 10,
      max: 2000,
      comment: 'Incremental delay in milliseconds'
    },
    numberOfWordsForInterruption: {
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
    ambientNoise: {
      type: Boolean,
      default: false
    },
    hangupAfterLLMCall: {
      type: Boolean,
      default: false
    },
    callCancellationPrompt: {
      type: String,
      default: null
    },
    backchannelingMessageGap: {
      type: Number,
      default: 5
    },
    backchannelingStartDelay: {
      type: Number,
      default: 5
    },
    ambientNoiseTrack: {
      type: String,
      default: 'office-ambience'
    },
    voicemail: {
      type: Boolean,
      default: false
    },
    inboundLimit: {
      type: Number,
      default: -1
    },
    whitelistPhoneNumbers: [{
      type: String
    }],
    disallowUnknownNumbers: {
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
