import { config } from '../config';

export interface MLTrainResult {
  message: string;
  status: string;
  metrics: {
    decision_tree_mse?: number;
    decision_tree_r2?: number;
    kmeans_inertia?: number;
  };
}

export interface MLPredictResult {
  fit_score: number;
  cluster_id: number;
}

export interface OptimizeTeamRequest {
  projectId: string;
  budgetLimit: number;
  requiredRoles: string[];
  maxDeadlineWeeks: number;
  minExperience: number;
  candidates: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    experienceYears: number;
    costPerHour: number;
    availabilityHrs: number;
    skills: string[];
  }[];
}

export interface OptimizeTeamResponse {
  optimality_score: number;
  total_cost: number;
  members: {
    candidate_id: string;
    assigned_role: string;
  }[];
}

class MLService {
  private url = config.mlServiceUrl;

  async trainModels(): Promise<MLTrainResult> {
    const res = await fetch(`${this.url}/ml/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`ML service failed to train: ${res.statusText}`);
    }

    return await res.json() as MLTrainResult;
  }

  async predictCandidate(candidateData: any): Promise<MLPredictResult> {
    const res = await fetch(`${this.url}/ml/predict-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });

    if (!res.ok) {
      throw new Error(`ML service failed to predict candidate: ${res.statusText}`);
    }

    return await res.json() as MLPredictResult;
  }

  async optimizeTeam(criteria: OptimizeTeamRequest): Promise<OptimizeTeamResponse> {
    const res = await fetch(`${this.url}/search/optimize-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`ML service failed to optimize team: ${res.statusText}. Details: ${errBody}`);
    }

    return await res.json() as OptimizeTeamResponse;
  }
}

export const mlService = new MLService();
export default mlService;
