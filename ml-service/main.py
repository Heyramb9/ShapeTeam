import os
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from src.config import config
from src.preprocessing import load_and_preprocess_dataset, get_feature_matrix, FEATURES, generate_deterministic_embedding
from src.algorithms.decision_tree import DecisionTreeModel
from src.algorithms.kmeans_cluster import KMeansModel
from src.prolog_engine import prolog_engine
from src.algorithms.a_star_search import optimize_team_a_star

app = FastAPI(
    title="ShapeTeam ML Service",
    description="Python ML microservice handling predictive fit scores, K-Means clustering, Prolog constraint filtering, and A* team search optimization."
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for inputs/outputs
class PredictRequest(BaseModel):
    Experience_Years: float
    Performance_Rating: float
    Communication_Score: float
    Leadership_Score: float
    Teamwork_Score: float
    Problem_Solving: float
    Current_Workload_Percent: float  # Mapping to Current_Workload_%
    Skill_Match_Percent: float       # Mapping to Skill_Match_%
    Behavior_Match_Percent: float    # Mapping to Behavior_Match_%

class PredictResponse(BaseModel):
    fit_score: float
    cluster_id: int

class CandidateInput(BaseModel):
    id: str
    fullName: str
    email: str
    role: str
    experienceYears: float
    costPerHour: float
    availabilityHrs: float
    skills: List[str]
    fitScore: Optional[float] = None
    clusterId: Optional[int] = None

class OptimizeRequest(BaseModel):
    projectId: str
    budgetLimit: float
    requiredRoles: List[str]
    maxDeadlineWeeks: int
    minExperience: float
    candidates: List[CandidateInput]

class TeamMemberResponse(BaseModel):
    candidate_id: str
    assigned_role: str
    fullName: str
    role: str
    experienceYears: float
    costPerHour: float
    availabilityHrs: float
    fitScore: Optional[float] = None
    skills: List[str]

class OptimizeResponse(BaseModel):
    optimality_score: float
    total_cost: float
    members: List[TeamMemberResponse]

# Model global references (loaded on startup if trained)
dt_model = DecisionTreeModel()
km_model = KMeansModel(n_clusters=10)

def load_models_safely():
    dt_path = os.path.join(config["model_dir"], "decision_tree.joblib")
    km_path = os.path.join(config["model_dir"], "kmeans.joblib")
    
    dt_loaded = False
    km_loaded = False
    
    if os.path.exists(dt_path):
        try:
            dt_model.load(dt_path)
            dt_loaded = True
        except Exception as e:
            print(f"Error loading Decision Tree model: {e}")
            
    if os.path.exists(km_path):
        try:
            km_model.load(km_path)
            km_loaded = True
        except Exception as e:
            print(f"Error loading K-Means model: {e}")
            
    return dt_loaded, km_loaded

@app.on_event("startup")
def startup_event():
    dt_loaded, km_loaded = load_models_safely()
    if dt_loaded and km_loaded:
        print("🚀 Machine Learning models loaded successfully on startup.")
    else:
        print("⚠️ Models not found or could not be loaded. Please run /ml/train to train them.")

@app.get("/health")
def health_check():
    dt_loaded = os.path.exists(os.path.join(config["model_dir"], "decision_tree.joblib"))
    km_loaded = os.path.exists(os.path.join(config["model_dir"], "kmeans.joblib"))
    return {
        "status": "OK",
        "models_trained": dt_loaded and km_loaded,
        "prolog_rules_found": os.path.exists(config["rules_path"])
    }

@app.post("/ml/train")
def train_models():
    try:
        print("📊 ML Training started. Loading dataset...")
        df = load_and_preprocess_dataset()
        X, y = get_feature_matrix(df)
        
        print(f"📊 Training on {X.shape[0]} records with {X.shape[1]} features.")
        
        dt_path = os.path.join(config["model_dir"], "decision_tree.joblib")
        dt_metrics = dt_model.train(X, y)
        dt_model.save(dt_path)
        
        km_path = os.path.join(config["model_dir"], "kmeans.joblib")
        km_metrics = km_model.train(X)
        km_model.save(km_path)
        
        return {
            "message": "Models trained successfully.",
            "status": "SUCCESS",
            "metrics": {
                "decision_tree_mse": dt_metrics["mse"],
                "decision_tree_r2": dt_metrics["r2"],
                "kmeans_inertia": km_metrics["inertia"]
            }
        }
    except Exception as e:
        print(f"❌ Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/ml/predict-score", response_model=PredictResponse)
def predict_score(req: PredictRequest):
    dt_path = os.path.join(config["model_dir"], "decision_tree.joblib")
    km_path = os.path.join(config["model_dir"], "kmeans.joblib")
    
    if not os.path.exists(dt_path) or not os.path.exists(km_path):
        # Auto-train if models don't exist yet
        try:
            print("🤖 Models not trained. Triggering auto-training on synthetic dataset...")
            train_models()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Models not trained and auto-training failed: {str(e)}")

    try:
        # Prepare feature vector
        features = np.array([
            req.Experience_Years,
            req.Performance_Rating,
            req.Communication_Score,
            req.Leadership_Score,
            req.Teamwork_Score,
            req.Problem_Solving,
            req.Current_Workload_Percent,
            req.Skill_Match_Percent,
            req.Behavior_Match_Percent
        ]).reshape(1, -1)
        
        fit_score = dt_model.predict(features)[0]
        cluster_id = int(km_model.predict(features)[0])
        
        return PredictResponse(
            fit_score=float(fit_score),
            cluster_id=cluster_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/search/optimize-team", response_model=OptimizeResponse)
def optimize_team(req: OptimizeRequest):
    try:
        # 1. Assert candidate facts into our custom Prolog engine
        prolog_engine.clear_facts()
        for c in req.candidates:
            # We assert candidate_cost(Id, Cost) and candidate_exp(Id, Exp)
            prolog_engine.assert_candidate(c.id, c.costPerHour, c.experienceYears)

        # 2. Run Prolog Rules constraint check: eligible_candidate(Id, MaxCost, MinExp)
        # Note: We filter by budgetLimit (as maximum hourly cost filter) and minExperience
        # To make it realistic, a single candidate's hourly cost shouldn't exceed budgetLimit
        eligible_ids = prolog_engine.query_eligible_candidates(
            max_cost=req.budgetLimit,
            min_exp=req.minExperience
        )

        if not eligible_ids:
            raise HTTPException(status_code=400, detail="No candidates satisfied the Prolog eligibility rules (experience & cost constraints).")

        # Create mapping for candidates for easy retrieval
        candidates_map = {c.id: c for c in req.candidates}
        
        # 3. Predict/Assign fitScore if missing, and structure candidate list
        processed_candidates = []
        
        # We ensure models are loaded to predict fitScores if they were not passed
        dt_path = os.path.join(config["model_dir"], "decision_tree.joblib")
        models_available = os.path.exists(dt_path)
        if not models_available:
            try:
                train_models()
                models_available = True
            except Exception:
                pass

        for cid in eligible_ids:
            c = candidates_map[cid]
            fit_score = c.fitScore
            
            # If candidate does not have a precalculated fitScore and model is available, predict it
            if fit_score is None and models_available:
                try:
                    # Synthesize features from candidate profile
                    # Default typical middle values for missing metrics
                    features = np.array([
                        c.experienceYears,
                        8.0,  # Performance Rating
                        80.0, # Communication
                        75.0, # Leadership
                        80.0, # Teamwork
                        80.0, # Problem Solving
                        20.0, # Workload %
                        85.0, # Skill Match %
                        80.0  # Behavior Match %
                    ]).reshape(1, -1)
                    fit_score = float(dt_model.predict(features)[0])
                except Exception:
                    fit_score = 70.0 # Default fallback score
            elif fit_score is None:
                fit_score = 70.0 # Default fallback score
                
            processed_candidates.append({
                "id": c.id,
                "fullName": c.fullName,
                "email": c.email,
                "role": c.role,
                "experienceYears": c.experienceYears,
                "costPerHour": c.costPerHour,
                "availabilityHrs": c.availabilityHrs,
                "skills": c.skills,
                "fitScore": fit_score
            })

        # 4. Prune candidate pool size to top <= 5,000 candidates based on fitScore
        processed_candidates.sort(key=lambda x: x["fitScore"], reverse=True)
        pruned_candidates = processed_candidates[:5000]

        print(f"✂️ Pruned candidate pool from {len(processed_candidates)} to top {len(pruned_candidates)} by fit_score.")

        # 5. Run A* Search Algorithm
        selected_members, total_cost, optimality_score = optimize_team_a_star(
            required_roles=req.requiredRoles,
            candidates=pruned_candidates,
            budget_limit=req.budgetLimit,
            weight_fit=config["weight_fit"]
        )

        if not selected_members:
            raise HTTPException(
                status_code=400,
                detail="A* search failed to find a valid team configuration matching the budget limit and role requirements."
            )

        # Clear facts to prevent memory build-up
        prolog_engine.clear_facts()

        # Build response
        members_response = [
            TeamMemberResponse(
                candidate_id=m["candidate_id"],
                assigned_role=m["assigned_role"],
                fullName=m["fullName"],
                role=m["role"],
                experienceYears=m["experienceYears"],
                costPerHour=m["costPerHour"],
                availabilityHrs=m["availabilityHrs"],
                fitScore=m["fitScore"],
                skills=m["skills"]
            )
            for m in selected_members
        ]

        return OptimizeResponse(
            optimality_score=optimality_score,
            total_cost=total_cost,
            members=members_response
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error during team optimization: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# Utilities for pgvector integration
@app.post("/ml/generate-embedding")
def get_embedding(skills: List[str]):
    """
    Utility endpoint for generating a 384-dimensional unit vector embedding for a list of skills.
    Matches pgvector format for insertion.
    """
    embedding = generate_deterministic_embedding(skills)
    return {"skills": skills, "embedding": embedding}
