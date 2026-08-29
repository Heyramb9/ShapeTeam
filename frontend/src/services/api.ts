const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Candidate {
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
}

export interface Project {
  id: string;
  title: string;
  budgetLimit: number;
  requiredRoles: string[];
  maxDeadlineWeeks: number;
  minExperience: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  candidateId: string;
  assignedRole: string;
  candidate: Candidate;
}

export interface Team {
  id: string;
  projectId: string;
  totalCost: number;
  optimalityScore: number;
  createdAt: string;
  members: TeamMember[];
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  }

  // Candidates
  async syncCandidates(): Promise<{ success: boolean; message: string; count: number }> {
    return this.request<{ success: boolean; message: string; count: number }>('/candidates/sync', {
      method: 'POST',
    });
  }

  async getCandidates(): Promise<{ success: boolean; count: number; candidates: Candidate[] }> {
    return this.request<{ success: boolean; count: number; candidates: Candidate[] }>('/candidates');
  }

  // Projects
  async createProject(project: {
    title: string;
    budgetLimit: number;
    requiredRoles: string[];
    maxDeadlineWeeks: number;
    minExperience: number;
  }): Promise<{ success: boolean; message: string; project: Project }> {
    return this.request<{ success: boolean; message: string; project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProjects(): Promise<{ success: boolean; count: number; projects: Project[] }> {
    return this.request<{ success: boolean; count: number; projects: Project[] }>('/projects');
  }

  async getProjectById(id: string): Promise<{ success: boolean; project: Project; teams: Team[] }> {
    return this.request<{ success: boolean; project: Project; teams: Team[] }>(`/projects/${id}`);
  }

  // Teams
  async generateTeam(projectId: string): Promise<{ success: boolean; fromCache: boolean; team: Team }> {
    return this.request<{ success: boolean; fromCache: boolean; team: Team }>('/teams/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  }

  async getTeamsByProject(projectId: string): Promise<{ success: boolean; count: number; teams: Team[] }> {
    return this.request<{ success: boolean; count: number; teams: Team[] }>(`/projects/${projectId}/teams`);
  }
}

export const apiService = new ApiService();
export default apiService;
