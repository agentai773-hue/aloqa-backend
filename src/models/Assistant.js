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
    enum: ['conversation', 'webhook', 'sales', 'support', 'appointment', 'survey', 'other'],
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
    provider: {
      type: String,
      default: 'openai',
      enum: ['openai', 'anthropic', 'groq', 'together']
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    maxTokens: {
      type: Number,
      default: 150,
      min: 1,
      max: 4096
    },
    temperature: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 2
    },
    topP: {
      type: Number,
      default: 0.9
    }
  },
  
  // Synthesizer Configuration (Text-to-Speech)
  synthesizerConfig: {
    provider: {
      type: String,
      default: 'polly',
      enum: ['polly', 'elevenlabs', 'deepgram', 'xtts']
    },
    voice: {
      type: String,
      default: 'Matthew'
    },
    language: {
      type: String,
      default: 'en-US'
    },
    engine: {
      type: String,
      default: 'generative'
    }
  },
  
  // Transcriber Configuration (Speech-to-Text)
  transcriberConfig: {
    provider: {
      type: String,
      default: 'deepgram',
      enum: ['deepgram', 'whisper']
    },
    model: {
      type: String,
      default: 'nova-2'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Task Configuration
  taskConfig: {
    hangupAfterSilence: {
      type: Number,
      default: 10,
      comment: 'Seconds of silence before hanging up'
    },
    callTerminate: {
      type: Number,
      default: 90,
      comment: 'Maximum call duration in seconds'
    },
    incrementalDelay: {
      type: Number,
      default: 400
    },
    numberOfWordsForInterruption: {
      type: Number,
      default: 2
    },
    backchanneling: {
      type: Boolean,
      default: false
    },
    ambientNoise: {
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
