const axios = require('axios');

class VoiceService {
  constructor() {
    this.baseUrl = 'https://api.bolna.ai';
    this.token = process.env.ALOQA_TOKEN; // Using existing Bolna token
    
    if (!this.token) {
      console.warn('Warning: ALOQA_TOKEN not found in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get all voices from Bolna API
   * @returns {Promise<Array>} List of voices
   */
  async getAllVoices() {
    try {
      console.log('Fetching voices from Bolna API...');
      const response = await this.client.get('/me/voices');
      
      console.log(`Successfully fetched ${response.data?.length || 0} voices`);
      return {
        success: true,
        data: response.data || [],
        total: response.data?.length || 0
      };
    } catch (error) {
      console.error('Bolna API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch voices from Bolna');
    }
  }

  /**
   * Get voice by ID from Bolna API
   * @param {string} voiceId - The voice ID
   * @returns {Promise<Object>} Voice details
   */
  async getVoiceById(voiceId) {
    try {
      const voices = await this.getAllVoices();
      const voice = voices.data.find(v => v.voice_id === voiceId || v.id === voiceId);
      
      if (!voice) {
        throw new Error('Voice not found');
      }
      
      return {
        success: true,
        data: voice
      };
    } catch (error) {
      console.error('Bolna API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch voice details from Bolna');
    }
  }

  /**
   * Get voice providers from available voices
   * @returns {Promise<Array>} List of unique providers
   */
  async getVoiceProviders() {
    try {
      const voices = await this.getAllVoices();
      const providers = [...new Set(voices.data.map(voice => voice.provider))];
      
      return {
        success: true,
        data: providers.map(provider => ({
          value: provider,
          label: provider.charAt(0).toUpperCase() + provider.slice(1),
          color: this.getProviderColor(provider)
        }))
      };
    } catch (error) {
      console.error('Error getting voice providers:', error.message);
      throw new Error('Failed to get voice providers');
    }
  }

  /**
   * Get accent categories from available voices
   * @returns {Promise<Array>} List of unique accents
   */
  async getAccentCategories() {
    try {
      const voices = await this.getAllVoices();
      const accents = [...new Set(voices.data.map(voice => voice.accent).filter(Boolean))];
      
      return {
        success: true,
        data: accents.map(accent => ({
          value: accent,
          label: accent,
          color: 'bg-blue-500'
        }))
      };
    } catch (error) {
      console.error('Error getting voice accents:', error.message);
      throw new Error('Failed to get voice accents');
    }
  }

  /**
   * Helper method to get color for provider
   * @param {string} provider - Provider name
   * @returns {string} CSS color class
   */
  getProviderColor(provider) {
    const colors = {
      'polly': 'bg-orange-500',
      'cartesia': 'bg-purple-500',
      'elevenlabs': 'bg-green-500',
      'deepgram': 'bg-blue-500',
      'sarvam': 'bg-indigo-500',
      'smallest': 'bg-pink-500',
      'azuretts': 'bg-cyan-500'
    };
    return colors[provider] || 'bg-gray-500';
  }

  /**
   * Search voices with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Filtered voices
   */
  async searchVoices(filters = {}) {
    try {
      const voices = await this.getAllVoices();
      let filteredVoices = voices.data;

      // Filter by provider
      if (filters.provider) {
        filteredVoices = filteredVoices.filter(voice => 
          voice.provider?.toLowerCase() === filters.provider.toLowerCase()
        );
      }

      // Filter by search term (name, accent, model)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredVoices = filteredVoices.filter(voice =>
          voice.name?.toLowerCase().includes(searchTerm) ||
          voice.accent?.toLowerCase().includes(searchTerm) ||
          voice.model?.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by accent
      if (filters.accent) {
        filteredVoices = filteredVoices.filter(voice =>
          voice.accent?.toLowerCase().includes(filters.accent.toLowerCase())
        );
      }

      // Sort voices
      if (filters.sortBy) {
        filteredVoices.sort((a, b) => {
          const aVal = a[filters.sortBy] || '';
          const bVal = b[filters.sortBy] || '';
          
          if (filters.sortDirection === 'desc') {
            return bVal.localeCompare(aVal);
          }
          return aVal.localeCompare(bVal);
        });
      }

      return {
        success: true,
        data: filteredVoices,
        total: filteredVoices.length,
        filters: filters
      };
    } catch (error) {
      console.error('Error searching voices:', error.message);
      throw new Error('Failed to search voices');
    }
  }
}

module.exports = new VoiceService();