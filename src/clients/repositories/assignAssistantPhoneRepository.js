// clients/repositories/assignAssistantPhoneRepository.js
const AssignAssistantPhone = require('../../models/AssignAssistantPhone');

/**
 * Create new assignment
 */
async function createAssignment(assignmentData) {
  const assignment = new AssignAssistantPhone(assignmentData);
  return await assignment.save();
}

/**
 * Get all assignments for a user
 */
async function getAssignmentsByUserId(userId) {
  return await AssignAssistantPhone.find({
    userId: userId,
    status: { $ne: 'deleted' },
    deletedAt: null
  })
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName country')
    .sort({ createdAt: -1 });
}

/**
 * Get assignments by user and project
 */
async function getAssignmentsByUserAndProject(userId, projectName) {
  return await AssignAssistantPhone.find({
    userId: userId,
    projectName: projectName,
    status: { $ne: 'deleted' },
    deletedAt: null
  })
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName country')
    .sort({ createdAt: -1 });
}

/**
 * Get single assignment by ID
 */
async function getAssignmentById(assignmentId, userId) {
  return await AssignAssistantPhone.findOne({
    _id: assignmentId,
    userId: userId,
    status: { $ne: 'deleted' },
    deletedAt: null
  })
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName country');
}

/**
 * Check if assignment already exists
 */
async function checkAssignmentExists(userId, assistantId, phoneId, projectName) {
  return await AssignAssistantPhone.findOne({
    userId: userId,
    assistantId: assistantId,
    phoneId: phoneId,
    projectName: projectName,
    status: { $ne: 'deleted' },
    deletedAt: null
  });
}

/**
 * Update assignment (unassign by soft delete)
 */
async function updateAssignment(assignmentId, updateData) {
  return await AssignAssistantPhone.findByIdAndUpdate(
    assignmentId,
    updateData,
    { new: true }
  )
    .populate('assistantId', 'agentName agentType')
    .populate('phoneId', 'phoneNumber friendlyName country');
}

/**
 * Soft delete assignment
 */
async function deleteAssignment(assignmentId, userId) {
  return await AssignAssistantPhone.findByIdAndUpdate(
    { _id: assignmentId, userId: userId },
    {
      status: 'deleted',
      deletedAt: new Date()
    },
    { new: true }
  );
}

/**
 * Get all projects for a user
 */
async function getProjectsByUserId(userId) {
  return await AssignAssistantPhone.distinct('projectName', {
    userId: userId,
    status: { $ne: 'deleted' },
    deletedAt: null
  });
}

module.exports = {
  createAssignment,
  getAssignmentsByUserId,
  getAssignmentsByUserAndProject,
  getAssignmentById,
  checkAssignmentExists,
  updateAssignment,
  deleteAssignment,
  getProjectsByUserId
};
