import { Router } from 'express';
import * as candidateController from '../controllers/candidateController';
import * as projectController from '../controllers/projectController';
import * as teamController from '../controllers/teamController';

const router = Router();

// Candidates Routes
router.post('/candidates/sync', candidateController.syncCandidates);
router.get('/candidates', candidateController.getCandidates);

// Projects Routes
router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getProjects);
router.get('/projects/:id', projectController.getProjectById);

// Teams Routes
router.post('/teams/generate', teamController.generateTeam);
router.get('/projects/:projectId/teams', teamController.getTeamsByProject);

export default router;
