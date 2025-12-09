const projectRepository = require('../repositories/projectRepository');

class ProjectService {
  // Get all projects for a client with filtering
  async getAllProjects(clientId, filters = {}) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const result = await projectRepository.getAllByClientId(clientId, filters);
      
      return {
        success: true,
        message: 'Projects fetched successfully',
        data: result.projects,
        pagination: {
          current: result.page,
          pages: result.totalPages,
          total: result.total,
          limit: result.limit
        }
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Get single project
  async getProject(projectId, clientId) {
    try {
      if (!projectId || !clientId) {
        throw new Error('Project ID and Client ID are required');
      }

      const project = await projectRepository.getByIdAndClientId(projectId, clientId);
      
      return {
        success: true,
        message: 'Project fetched successfully',
        data: project
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Create new project
  async createProject(clientId, projectData) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Validate required fields
      if (!projectData.projectName) {
        throw new Error('Project name is required');
      }

      // Prepare project data with userId
      const newProjectData = {
        ...projectData,
        userId: clientId,
        projectStatus: projectData.projectStatus || 'planning'
      };

      const project = await projectRepository.create(newProjectData);
      
      // Populate the userId after creation
      const populatedProject = await projectRepository.getByIdAndClientId(project._id, clientId);
      
      return {
        success: true,
        message: 'Project created successfully',
        data: populatedProject
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Update project
  async updateProject(projectId, clientId, updateData) {
    try {
      if (!projectId || !clientId) {
        throw new Error('Project ID and Client ID are required');
      }

      // Remove clientId from update data if present (shouldn't be changed)
      const { clientId: _, ...safeUpdateData } = updateData;

      const project = await projectRepository.updateByIdAndClientId(projectId, clientId, safeUpdateData);
      
      return {
        success: true,
        message: 'Project updated successfully',
        data: project
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Delete project
  async deleteProject(projectId, clientId) {
    try {
      if (!projectId || !clientId) {
        throw new Error('Project ID and Client ID are required');
      }

      const result = await projectRepository.deleteByIdAndClientId(projectId, clientId);
      
      return {
        success: true,
        message: result.message
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Get project statistics
  async getProjectStats(clientId) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const stats = await projectRepository.getStatsByClientId(clientId);
      
      return {
        success: true,
        message: 'Project statistics fetched successfully',
        data: stats
      };
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }

  // Validate project ownership
  async validateProjectOwnership(projectId, clientId) {
    try {
      if (!projectId || !clientId) {
        throw new Error('Project ID and Client ID are required');
      }

      const belongs = await projectRepository.belongsToClient(projectId, clientId);
      
      if (!belongs) {
        throw new Error('Project not found or access denied');
      }

      return true;
    } catch (error) {
      throw new Error(`Service error: ${error.message}`);
    }
  }
}

module.exports = new ProjectService();