// clients/repositories/assistantRepository.js
const Assistant = require('../../models/Assistant');

/**
 * Get all assistants for a specific user
 */
async function getAssistantsByUserId(userId) {
  return await Assistant.find({
    userId: userId,
    status: { $ne: 'deleted' }
  })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 });
}

/**
 * Get single assistant by ID
 */
async function getAssistantById(assistantId, userId) {
  return await Assistant.findOne({
    _id: assistantId,
    userId: userId,
    status: { $ne: 'deleted' }
  }).populate('userId', 'firstName lastName email');
}

module.exports = {
  getAssistantsByUserId,
  getAssistantById
};
