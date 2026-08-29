import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Ensure the local data directory exists for the fallback database
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CANDIDATES_FILE = path.join(DATA_DIR, 'candidates.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');

// Interface definitions to keep types consistent
export interface DBCandidate {
  id: string;
  fullName: string;
  email: string;
  role: string;
  experienceYears: number;
  costPerHour: number;
  availabilityHrs: number;
  skills: string[];
  clusterId: number | null;
  fitScore: number | null;
  embedding?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBProject {
  id: string;
  title: string;
  budgetLimit: number;
  requiredRoles: string[];
  maxDeadlineWeeks: number;
  minExperience: number;
  createdAt: Date;
}

export interface DBTeam {
  id: string;
  projectId: string;
  totalCost: number;
  optimalityScore: number;
  createdAt: Date;
  members?: DBTeamMember[];
}

export interface DBTeamMember {
  id: string;
  teamId: string;
  candidateId: string;
  assignedRole: string;
  candidate?: DBCandidate;
}

class DBService {
  private prisma: PrismaClient | null = null;
  private isFallbackMode = false;

  constructor() {
    this.initializePrisma();
  }

  private async initializePrisma() {
    if (config.useMockDb) {
      console.log('💡 Force-Mock DB enabled in configuration. Using JSON file database.');
      this.isFallbackMode = true;
      return;
    }

    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.databaseUrl,
          },
        },
      });

      // Test connection
      await this.prisma.$connect();
      console.log('🚀 Successfully connected to PostgreSQL via Prisma.');
    } catch (error) {
      console.warn('⚠️ PostgreSQL database is offline or Prisma could not connect. Falling back to local JSON file database.');
      this.prisma = null;
      this.isFallbackMode = true;
    }
  }

  // --- Helper methods for JSON database fallback ---
  private readJSON(filePath: string): any[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading database file ${filePath}:`, e);
      return [];
    }
  }

  private writeJSON(filePath: string, data: any[]) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing database file ${filePath}:`, e);
    }
  }

  // --- Public APIs matching Prisma query structures ---

  // Candidates
  async syncCandidates(candidates: any[]): Promise<number> {
    if (this.isFallbackMode) {
      // Sync candidates to JSON
      const current = this.readJSON(CANDIDATES_FILE);
      const currentMap = new Map(current.map(c => [c.email, c]));
      
      let newCount = 0;
      candidates.forEach(c => {
        const existing = currentMap.get(c.email);
        const record = {
          id: existing?.id || c.id || Math.random().toString(36).substr(2, 9),
          fullName: c.fullName,
          email: c.email,
          role: c.role,
          experienceYears: Number(c.experienceYears),
          costPerHour: Number(c.costPerHour),
          availabilityHrs: Number(c.availabilityHrs),
          skills: c.skills,
          clusterId: c.clusterId !== undefined ? c.clusterId : (existing?.clusterId ?? null),
          fitScore: c.fitScore !== undefined ? c.fitScore : (existing?.fitScore ?? null),
          embedding: c.embedding || (existing?.embedding ?? null),
          createdAt: existing ? new Date(existing.createdAt) : new Date(),
          updatedAt: new Date()
        };
        currentMap.set(c.email, record);
        if (!existing) newCount++;
      });

      this.writeJSON(CANDIDATES_FILE, Array.from(currentMap.values()));
      return newCount || candidates.length;
    }

    // PostgreSQL bulk upsert
    let count = 0;
    const client = this.prisma!;
    for (const c of candidates) {
      await client.candidate.upsert({
        where: { email: c.email },
        update: {
          fullName: c.fullName,
          role: c.role as any,
          experienceYears: c.experienceYears,
          costPerHour: c.costPerHour,
          availabilityHrs: c.availabilityHrs,
          skills: c.skills,
          clusterId: c.clusterId,
          fitScore: c.fitScore,
          // prisma doesn't support vector type natively for updates without raw SQL,
          // so we will handle pgvector writing in an update step or raw query if needed
        },
        create: {
          fullName: c.fullName,
          email: c.email,
          role: c.role as any,
          experienceYears: c.experienceYears,
          costPerHour: c.costPerHour,
          availabilityHrs: c.availabilityHrs,
          skills: c.skills,
          clusterId: c.clusterId,
          fitScore: c.fitScore,
        }
      });
      count++;
    }
    return count;
  }

  async getAllCandidates(): Promise<DBCandidate[]> {
    if (this.isFallbackMode) {
      return this.readJSON(CANDIDATES_FILE);
    }
    return (await this.prisma!.candidate.findMany()) as any[];
  }

  // Projects
  async createProject(projectData: Omit<DBProject, 'id' | 'createdAt'>): Promise<DBProject> {
    if (this.isFallbackMode) {
      const projects = this.readJSON(PROJECTS_FILE);
      const newProject: DBProject = {
        id: Math.random().toString(36).substr(2, 9),
        title: projectData.title,
        budgetLimit: Number(projectData.budgetLimit),
        requiredRoles: projectData.requiredRoles,
        maxDeadlineWeeks: Number(projectData.maxDeadlineWeeks),
        minExperience: Number(projectData.minExperience),
        createdAt: new Date()
      };
      projects.push(newProject);
      this.writeJSON(PROJECTS_FILE, projects);
      return newProject;
    }

    return (await this.prisma!.projectRequirement.create({
      data: {
        title: projectData.title,
        budgetLimit: projectData.budgetLimit,
        requiredRoles: projectData.requiredRoles,
        maxDeadlineWeeks: projectData.maxDeadlineWeeks,
        minExperience: projectData.minExperience
      }
    })) as any;
  }

  async getAllProjects(): Promise<DBProject[]> {
    if (this.isFallbackMode) {
      return this.readJSON(PROJECTS_FILE);
    }
    return (await this.prisma!.projectRequirement.findMany()) as any[];
  }

  async getProjectById(id: string): Promise<DBProject | null> {
    if (this.isFallbackMode) {
      const projects = this.readJSON(PROJECTS_FILE);
      return projects.find(p => p.id === id) || null;
    }
    return (await this.prisma!.projectRequirement.findUnique({ where: { id } })) as any;
  }

  // Teams
  async saveTeam(projectId: string, totalCost: number, optimalityScore: number, members: Omit<DBTeamMember, 'id' | 'teamId'>[]): Promise<DBTeam> {
    if (this.isFallbackMode) {
      const teams = this.readJSON(TEAMS_FILE);
      const teamId = Math.random().toString(36).substr(2, 9);
      
      const candidates = this.readJSON(CANDIDATES_FILE);
      const candidatesMap = new Map(candidates.map(c => [c.id, c]));

      const teamMembers: DBTeamMember[] = members.map(m => ({
        id: Math.random().toString(36).substr(2, 9),
        teamId,
        candidateId: m.candidateId,
        assignedRole: m.assignedRole,
        candidate: candidatesMap.get(m.candidateId)
      }));

      const newTeam: DBTeam = {
        id: teamId,
        projectId,
        totalCost,
        optimalityScore,
        createdAt: new Date(),
        members: teamMembers
      };

      teams.push(newTeam);
      this.writeJSON(TEAMS_FILE, teams);
      return newTeam;
    }

    const team = await this.prisma!.team.create({
      data: {
        projectId,
        totalCost,
        optimalityScore,
        members: {
          create: members.map(m => ({
            candidateId: m.candidateId,
            assignedRole: m.assignedRole
          }))
        }
      },
      include: {
        members: {
          include: {
            candidate: true
          }
        }
      }
    });

    return team as any;
  }

  async getTeamsByProject(projectId: string): Promise<DBTeam[]> {
    if (this.isFallbackMode) {
      const teams = this.readJSON(TEAMS_FILE);
      return teams.filter(t => t.projectId === projectId);
    }
    return (await this.prisma!.team.findMany({
      where: { projectId },
      include: {
        members: {
          include: {
            candidate: true
          }
        }
      }
    })) as any[];
  }
}

export const dbService = new DBService();
export default dbService;
