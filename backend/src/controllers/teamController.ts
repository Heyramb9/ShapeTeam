import { Request, Response } from 'express';
import dbService from '../services/db';
import mlService from '../services/mlService';
import cacheService from '../services/cacheService';

export const generateTeam = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing projectId in request body.'
      });
    }

    // Check Cache first to avoid redundant heavy A* searches
    const cacheKey = `optimized_team:${projectId}`;
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`🎯 Serving optimized team for project ${projectId} from cache.`);
      return res.status(200).json({
        success: true,
        fromCache: true,
        team: JSON.parse(cachedResult)
      });
    }

    // 1. Fetch project requirement
    const project = await dbService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found.`
      });
    }

    // 2. Fetch all candidates to pass as candidate pool
    const candidates = await dbService.getAllCandidates();
    if (candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No candidates available in the database. Please sync candidate data from Excel first.'
      });
    }

    console.log(`📦 Sending project details and pool of ${candidates.length} candidates to ML optimize-team microservice...`);

    // 3. Bridge request to Python microservice
    const optimizationResult = await mlService.optimizeTeam({
      projectId: project.id,
      budgetLimit: project.budgetLimit,
      requiredRoles: project.requiredRoles,
      maxDeadlineWeeks: project.maxDeadlineWeeks,
      minExperience: project.minExperience,
      candidates: candidates.map(c => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        role: c.role,
        experienceYears: c.experienceYears,
        costPerHour: c.costPerHour,
        availabilityHrs: c.availabilityHrs,
        skills: c.skills
      }))
    });

    console.log(`✨ Received optimized team. Optimality Score: ${optimizationResult.optimality_score}, Total Cost: ${optimizationResult.total_cost}`);

    // 4. Save generated team to database
    const savedTeam = await dbService.saveTeam(
      project.id,
      optimizationResult.total_cost,
      optimizationResult.optimality_score,
      optimizationResult.members.map(m => ({
        candidateId: m.candidate_id,
        assignedRole: m.assigned_role
      }))
    );

    // Cache the team result for 1 hour
    await cacheService.set(cacheKey, JSON.stringify(savedTeam), 3600);

    return res.status(200).json({
      success: true,
      fromCache: false,
      team: savedTeam
    });
  } catch (error: any) {
    console.error('Error generating team:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate optimal project team.',
      error: error.message
    });
  }
};

export const getTeamsByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const teams = await dbService.getTeamsByProject(projectId);
    return res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve teams.',
      error: error.message
    });
  }
};
