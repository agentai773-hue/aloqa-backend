const Project = require('../../models/Project');
const mongoose = require('mongoose');

class ProjectRepository {
  // Get all projects for a client with filtering and pagination
  async getAllByClientId(clientId, filters = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '' 
      } = filters;

      // Build query
      const query = { userId: new mongoose.Types.ObjectId(clientId) };
      
      // Add search filter
      if (search) {
        query.projectName = { $regex: search, $options: 'i' };
      }
      
      // Add status filter
      if (status) {
        query.projectStatus = status;
      }
      
      // Calculate skip
      const skip = (page - 1) * limit;
      
      // Execute queries in parallel
      const [projects, total] = await Promise.all([
        Project.find(query)
          .populate('userId', 'firstName lastName email username')
          .populate('phoneNumberId', 'phoneNumber country status')
          .populate('assistantId', '_id agentId agentName agentType')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Project.countDocuments(query)
      ]);
      
      return {
        projects,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  }

  // Get single project by ID and clientId
  async getByIdAndClientId(projectId, clientId) {
    try {
      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(clientId)
      }).populate('userId', 'firstName lastName email username')
        .populate('phoneNumberId', 'phoneNumber country status')
        .populate('assistantId', '_id agentId agentName agentType');

      if (!project) {
        throw new Error('Project not found');
      }

      return project;
    } catch (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  // Create new project
  async create(projectData) {
    try {
      const project = new Project(projectData);
      return await project.save();
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  // Update project
  async updateByIdAndClientId(projectId, clientId, updateData) {
    try {
      const project = await Project.findOneAndUpdate(
        { 
          _id: new mongoose.Types.ObjectId(projectId),
          userId: new mongoose.Types.ObjectId(clientId)
        },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('userId', 'firstName lastName email username')
        .populate('phoneNumberId', 'phoneNumber country status')
        .populate('assistantId', '_id agentId agentName agentType');

      if (!project) {
        throw new Error('Project not found');
      }

      return project;
    } catch (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  // Delete project
  async deleteByIdAndClientId(projectId, clientId) {
    try {
      const project = await Project.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(clientId)
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return { message: 'Project deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  // Get project statistics for a client
  async getStatsByClientId(clientId) {
    try {
      const stats = await Project.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(clientId) 
          } 
        },
        {
          $group: {
            _id: '$projectStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // Initialize all status counts
      const statsObj = {
        total: 0,
        planning: 0,
        'in-progress': 0,
        'on-hold': 0,
        completed: 0,
        cancelled: 0
      };

      // Populate stats
      stats.forEach(stat => {
        if (stat._id && statsObj.hasOwnProperty(stat._id)) {
          statsObj[stat._id] = stat.count;
          statsObj.total += stat.count;
        }
      });

      return statsObj;
    } catch (error) {
      throw new Error(`Failed to get project statistics: ${error.message}`);
    }
  }

  // Check if project belongs to client
  async belongsToClient(projectId, clientId) {
    try {
      const count = await Project.countDocuments({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(clientId)
      });
      
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to verify project ownership: ${error.message}`);
    }
  }
}

module.exports = new ProjectRepository();