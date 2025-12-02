const axios = require('axios');

class VoiceService {
  constructor() {
    this.elevenlabsApiUrl = 'https://api.elevenlabs.io';
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY || '1a617c05b806485b8cec965092ef69d11bc9c62642db1b85e92d223c862c60a3';
  }

  /**
   * Fetch all voices from ElevenLabs API
   * GET /v2/voices
   */
  async getAllVoices() {
    try {
      if (!this.elevenlabsApiKey) {
        throw new Error('ElevenLabs API key is not configured');
      }

      
      const response = await axios.get(
        `${this.elevenlabsApiUrl}/v2/voices`,
        {
          headers: {
            'xi-api-key': this.elevenlabsApiKey,
            'Content-Type': 'application/json'
          },
          params: {
            page_size: 100, // Get more voices
            include_total_count: true
          },
          timeout: 15000
        }
      );


      if (response.status === 200 && response.data.voices) {
        // Transform ElevenLabs voice data to match our frontend structure
        const transformedVoices = response.data.voices.map((voice, index) => ({
          id: `elevenlabs-${voice.voice_id}`,
          voice_id: voice.voice_id,
          name: voice.name,
          provider: 'elevenlabs',
          model: voice.high_quality_base_model_ids?.[0] || 'eleven_multilingual_v2',
          accent: this.detectAccent(voice),
          category: voice.category || 'premade',
          description: voice.description || '',
          preview_url: voice.preview_url,
          labels: voice.labels,
          settings: voice.settings
        }));
        
        return {
          success: true,
          data: transformedVoices,
          count: transformedVoices.length,
          total_count: response.data.total_count
        };
      }

      return {
        success: false,
        error: 'Unexpected response from ElevenLabs voices API',
        details: response.data
      };
    } catch (error) {
      console.error('Error fetching voices from ElevenLabs:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch voices',
        statusCode: error.response?.status || 500
      };
    }
  }

  /**
   * Get voice by ID
   */
  async getVoiceById(voiceId) {
    try {
      const allVoicesResponse = await this.getAllVoices();
      
      if (!allVoicesResponse.success) {
        return allVoicesResponse;
      }

      const voice = allVoicesResponse.data.find(v => v.id === voiceId || v.voice_id === voiceId);
      
      if (!voice) {
        return {
          success: false,
          error: 'Voice not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: voice
      };
    } catch (error) {
      console.error('Error fetching voice by ID:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch voice',
        statusCode: 500
      };
    }
  }

  /**
   * Detect accent from ElevenLabs voice data
   */
  detectAccent(voice) {
    // Check verified languages for accent information
    if (voice.verified_languages && voice.verified_languages.length > 0) {
      const primaryLanguage = voice.verified_languages[0];
      if (primaryLanguage.accent) {
        return primaryLanguage.accent;
      }
      
      // Map language codes to accents
      const languageAccentMap = {
        'en-US': 'American',
        'en-GB': 'British', 
        'en-AU': 'Australian',
        'en-CA': 'Canadian',
        'en-IN': 'Indian',
        'es-ES': 'Spanish',
        'es-MX': 'Mexican',
        'fr-FR': 'French',
        'de-DE': 'German',
        'it-IT': 'Italian',
        'pt-BR': 'Brazilian',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'zh-CN': 'Chinese',
      };
      
      return languageAccentMap[primaryLanguage.locale] || 
             languageAccentMap[primaryLanguage.language] || 
             primaryLanguage.language || 'Unknown';
    }
    
    // Check labels for accent hints
    if (voice.labels) {
      const labelKeys = Object.keys(voice.labels);
      for (const key of labelKeys) {
        if (key.toLowerCase().includes('accent')) {
          return voice.labels[key] || 'Unknown';
        }
        if (key.toLowerCase().includes('american')) return 'American';
        if (key.toLowerCase().includes('british')) return 'British';
        if (key.toLowerCase().includes('australian')) return 'Australian';
        if (key.toLowerCase().includes('indian')) return 'Indian';
      }
    }
    
    // Default accent based on voice name patterns
    const voiceName = voice.name?.toLowerCase() || '';
    if (voiceName.includes('british') || voiceName.includes('uk')) return 'British';
    if (voiceName.includes('american') || voiceName.includes('us')) return 'American';
    if (voiceName.includes('australian') || voiceName.includes('aussie')) return 'Australian';
    if (voiceName.includes('indian')) return 'Indian';
    if (voiceName.includes('irish')) return 'Irish';
    if (voiceName.includes('scottish')) return 'Scottish';
    
    return 'American'; // Default fallback
  }

  /**
   * Filter voices by provider
   */
  async getVoicesByProvider(provider) {
    try {
      const allVoicesResponse = await this.getAllVoices();
      
      if (!allVoicesResponse.success) {
        return allVoicesResponse;
      }

      const filteredVoices = allVoicesResponse.data.filter(voice => 
        voice.provider?.toLowerCase() === provider.toLowerCase()
      );

      return {
        success: true,
        data: filteredVoices,
        count: filteredVoices.length
      };
    } catch (error) {
      console.error('Error filtering voices by provider:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to filter voices',
        statusCode: 500
      };
    }
  }
}

module.exports = VoiceService;