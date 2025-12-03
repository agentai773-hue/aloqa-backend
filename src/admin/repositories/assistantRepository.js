const Assistant = require('../../models/Assistant');

/**
 * Assistant Repository
 * Handles all database operations for assistants
 */
class AssistantRepository {
  /**
   * Create a new assistant in database
   */
  async create(assistantData) {
    const assistant = new Assistant(assistantData);
    return await assistant.save();
  }

  /**
   * Find assistant by ID
   */
  async findById(id) {
    return await Assistant.findById(id);
  }

  /**
   * Find assistant by ID and populate user
   */
  async findByIdWithUser(id) {
    return await Assistant.findById(id).populate('userId', 'bearerToken email firstName lastName');
  }

  /**
   * Find all assistants with filters, search, and pagination
   */
  async findAll(filters = {}) {
    const { page = 1, limit = 10, search, agentType, ...otherFilters } = filters;
    
    // Build query object
    const query = { ...otherFilters };

    // Exclude deleted by default unless explicitly included
    if (!filters.status || filters.status !== 'deleted') {
      query.status = { $ne: 'deleted' };
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { agentName: searchRegex },
        { agentId: searchRegex },
        { agentType: searchRegex },
        { status: searchRegex }
      ];
    }

    // Add agent type filter
    if (agentType) {
      query.agentType = agentType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    return await Assistant.find(query)
      .populate('userId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
  }

  /**
   * Count assistants with filters and search
   */
  async countAssistants(filters = {}) {
    const { page, limit, search, agentType, ...otherFilters } = filters;
    
    // Build query object
    const query = { ...otherFilters };

    // Exclude deleted by default unless explicitly included
    if (!filters.status || filters.status !== 'deleted') {
      query.status = { $ne: 'deleted' };
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { agentName: searchRegex },
        { agentId: searchRegex },
        { agentType: searchRegex },
        { status: searchRegex }
      ];
    }

    // Add agent type filter
    if (agentType) {
      query.agentType = agentType;
    }

    return await Assistant.countDocuments(query);
  }

  /**
   * Find assistants by user ID
   */
  async findByUser(userId) {
    return await Assistant.find({ 
      userId, 
      status: { $ne: 'deleted' } 
    }).sort({ createdAt: -1 });
  }

  /**
   * Update assistant by ID
   */
  async update(id, updateData) {
    return await Assistant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete assistant (hard delete)
   */
  async delete(id) {
    return await Assistant.findByIdAndDelete(id);
  }

  /**
   * Soft delete assistant
   */
  async softDelete(id) {
    return await Assistant.findByIdAndUpdate(
      id,
      { status: 'deleted', deletedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Check if assistant exists
   */
  async exists(id) {
    return await Assistant.exists({ _id: id, status: { $ne: 'deleted' } });
  }

  /**
   * Count assistants with filters
   */
  async count(filters = {}) {
    const query = {};
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }

    return await Assistant.countDocuments(query);
  }
}

module.exports = new AssistantRepository();
