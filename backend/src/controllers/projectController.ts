import { Request, Response } from 'express';
import dbService from '../services/db';

export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, budgetLimit, requiredRoles, maxDeadlineWeeks, minExperience } = req.body;

    if (!title || !budgetLimit || !requiredRoles || !maxDeadlineWeeks || minExperience === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required project fields. Ensure title, budgetLimit, requiredRoles, maxDeadlineWeeks, and minExperience are provided.'
      });
    }

    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'requiredRoles must be a non-empty array of strings.'
      });
    }

    const project = await dbService.createProject({
      title,
      budgetLimit: Number(budgetLimit),
      requiredRoles: requiredRoles.map(r => r.toUpperCase().replace(/\s+/g, '_')),
      maxDeadlineWeeks: Number(maxDeadlineWeeks),
      minExperience: Number(minExperience)
    });

    return res.status(201).json({
      success: true,
      message: 'Project requirement created successfully.',
      project
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project requirement.',
      error: error.message
    });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await dbService.getAllProjects();
    return res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project requirements.',
      error: error.message
    });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await dbService.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${id} not found.`
      });
    }

    const teams = await dbService.getTeamsByProject(id);

    return res.status(200).json({
      success: true,
      project,
      teams
    });
  } catch (error: any) {
    console.error('Error fetching project by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details.',
      error: error.message
    });
  }
};
