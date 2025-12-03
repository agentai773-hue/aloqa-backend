const AssignUserVoice = require('../../models/AssignUserVoice');
const User = require('../../models/User');

const assignUserVoiceService = {
  // Assign a voice to user
  assignVoiceToUser: async (assignmentData) => {
    try {
      const { 
        userId, 
        voiceId, 
        voiceName, 
        voiceProvider = 'elevenlabs',
        voiceAccent,
        voiceModel,
        projectName,
        description 
      } = assignmentData;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if this voice is already assigned to this user for this project
      const existingAssignment = await AssignUserVoice.findOne({
        userId,
        voiceId,
        projectName,
        status: { $ne: 'deleted' }
      });

      if (existingAssignment) {
        throw new Error('This voice is already assigned to this user for this project');
      }

      // Create new assignment
      const newAssignment = new AssignUserVoice({
        userId,
        voiceId,
        voiceName,
        voiceProvider,
        voiceAccent,
        voiceModel,
        projectName,
        description,
        status: 'active'
      });

      const savedAssignment = await newAssignment.save();
      
      // Populate user details
      await savedAssignment.populate('user', 'firstName lastName email companyName');
      
      return savedAssignment;
    } catch (error) {
      throw new Error(error.message || 'Failed to assign voice to user');
    }
  },

  // Get all voice assignments with pagination and filters
  getAllAssignments: async (options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        userId, 
        status = 'active', 
        search 
      } = options;
      
      const skip = (page - 1) * limit;
      
      // Build filter query
      const filter = { status: { $ne: 'deleted' } };
      
      if (userId) {
        filter.userId = userId;
      }
      
      if (status && status !== 'all' && status !== undefined) {
        filter.status = status;
      }
      
      if (search) {
        filter.$or = [
          { voiceName: { $regex: search, $options: 'i' } },
          { projectName: { $regex: search, $options: 'i' } },
          { voiceAccent: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Get assignments with user details
      const assignments = await AssignUserVoice.find(filter)
        .populate('user', 'firstName lastName email companyName mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count
      const total = await AssignUserVoice.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        assignments,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get voice assignments');
    }
  },

  // Get assignments by user ID
  getAssignmentsByUser: async (userId, options = {}) => {
    try {
      const { page = 1, limit = 10, status } = options;
      
      const filter = { 
        userId, 
        status: { $ne: 'deleted' } 
      };
      
      if (status && status !== 'all') {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      
      const assignments = await AssignUserVoice.find(filter)
        .populate('user', 'firstName lastName email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await AssignUserVoice.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        assignments,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get user voice assignments');
    }
  },

  // Get single assignment by ID
  getAssignmentById: async (assignmentId) => {
    try {
      const assignment = await AssignUserVoice.findOne({
        _id: assignmentId,
        status: { $ne: 'deleted' }
      }).populate('user', 'firstName lastName email companyName mobile').lean();

      return assignment;
    } catch (error) {
      throw new Error(error.message || 'Failed to get voice assignment');
    }
  },

  // Update assignment
  updateAssignment: async (assignmentId, updateData) => {
    try {
      const allowedUpdates = [
        'voiceId', 
        'voiceName', 
        'voiceAccent', 
        'voiceModel', 
        'projectName', 
        'description',
        'status'
      ];
      
      // Filter update data to only allowed fields
      const filteredUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });

      const assignment = await AssignUserVoice.findOneAndUpdate(
        { _id: assignmentId, status: { $ne: 'deleted' } },
        filteredUpdateData,
        { new: true, runValidators: true }
      ).populate('user', 'firstName lastName email companyName');

      return assignment;
    } catch (error) {
      throw new Error(error.message || 'Failed to update voice assignment');
    }
  },

  // Delete assignment (soft delete)
  deleteAssignment: async (assignmentId) => {
    try {
      const assignment = await AssignUserVoice.findOneAndUpdate(
        { _id: assignmentId, status: { $ne: 'deleted' } },
        { 
          status: 'deleted',
          deletedAt: new Date()
        },
        { new: true }
      ).populate('user', 'firstName lastName email companyName');

      return assignment;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete voice assignment');
    }
  },

  // Update assignment status
  updateAssignmentStatus: async (assignmentId, status) => {
    try {
      const assignment = await AssignUserVoice.findOneAndUpdate(
        { _id: assignmentId, status: { $ne: 'deleted' } },
        { status },
        { new: true, runValidators: true }
      ).populate('user', 'firstName lastName email companyName');

      return assignment;
    } catch (error) {
      throw new Error(error.message || 'Failed to update voice assignment status');
    }
  },

  // Get voice usage statistics
  getVoiceStats: async () => {
    try {
      const totalAssignments = await AssignUserVoice.countDocuments({
        status: { $ne: 'deleted' }
      });

      const activeAssignments = await AssignUserVoice.countDocuments({
        status: 'active'
      });

      const inactiveAssignments = await AssignUserVoice.countDocuments({
        status: 'inactive'
      });

      // Get most used voices
      const mostUsedVoices = await AssignUserVoice.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        {
          $group: {
            _id: '$voiceId',
            voiceName: { $first: '$voiceName' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      return {
        totalAssignments,
        activeAssignments,
        inactiveAssignments,
        mostUsedVoices
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get voice statistics');
    }
  }
};

module.exports = assignUserVoiceService;