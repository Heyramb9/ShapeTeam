# 🔮 ShapeTeam — Hybrid AI Workforce Optimization Platform

> Form the **perfect project team** from a pool of 50,000 candidates using a four-stage hybrid pipeline: **Machine Learning → Symbolic Logic → Candidate Pruning → A\* Search**.

---

## 🏗️ Architecture Overview

```
shapeteam/
├── docker-compose.yml            # One-command full-stack deployment
├── train_models.py               # Standalone ML model training script
├── ShapeTeam_Dataset.xlsx
│
├── backend/                      # Node.js + Express API Gateway
│   ├── prisma/schema.prisma      # PostgreSQL + pgvector schema
│   └── src/
│       ├── config/               # Environment configuration
│       ├── controllers/          # Candidates, Projects, Teams
│       ├── routes/               # Express route definitions
│       └── services/             # DB (Prisma + fallback), Redis, ML client
│
├── frontend/                     # Next.js 14 App Router UI
│   └── src/
│       ├── app/                  # Page and layout components
│       └── services/api.ts       # Typed API client
│
└── ml-service/                   # Python FastAPI Microservice
    ├── main.py                   # API entry point
    ├── rules/team_rules.pl       # SWI-Prolog constraint rules
    └── src/
        ├── algorithms/
        │   ├── decision_tree.py  # Regression-based fit scoring
        │   ├── kmeans_cluster.py # Candidate clustering
        │   └── a_star_search.py  # Priority-queue team search
        ├── preprocessing.py      # Feature engineering & embeddings
        ├── prolog_engine.py      # Pure-Python Prolog interpreter
        └── config.py             # Path configuration
```

---

## ⚡ Optimization Pipeline Stages

| Stage | Component | Description |
|-------|-----------|-------------|
| **1** | Decision Tree + K-Means | Predict `fit_score` and assign `cluster_id` per candidate |
| **2** | Prolog Logic Engine | Filters candidates via `eligible_candidate/3` constraints (cost ≤ budget, exp ≥ min) |
| **3** | Candidate Pruning | Limits search pool to top ≤5,000 by `fit_score` |
| **4** | A\* Search | State-space search minimising `f(n) = g(n) + h(n)` to find globally optimal team |

---

## 🚀 Quick Start — Local Development (No Docker)

### Prerequisites
- **Node.js** 20+ and **npm**
- **Python** 3.10+

### 1. Train ML Models (one-time setup)
```bash
# From workspace root
pip install pandas scikit-learn joblib openpyxl
python train_models.py
```

### 2. Start the FastAPI ML Service
```bash
cd ml-service
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```

### 3. Start the Express Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🐳 Full Docker Deployment

> Requires Docker + Docker Compose

```bash
docker compose up --build
```

Services will start at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000

---

## 🔌 API Reference

### Express Core API (`localhost:5000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/candidates/sync` | Import 50k candidates from Excel |
| `GET` | `/api/candidates` | List all synced candidates |
| `POST` | `/api/projects` | Create a project requirement |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/teams/generate` | Run optimization pipeline & save team |

### FastAPI ML Service (`localhost:8000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ml/train` | Train Decision Tree + K-Means models |
| `POST` | `/ml/predict-score` | Predict `fit_score` and `cluster_id` |
| `POST` | `/search/optimize-team` | Full Prolog + A\* team optimization |
| `GET` | `/health` | ML service health check |

---

## 🗄️ Database Schema

The PostgreSQL schema (with `pgvector` extension) stores:

- **Candidate** — skills, experience, cost, fit score, cluster ID, 384-dim vector embedding
- **ProjectRequirement** — budget, required roles, deadline, min experience
- **Team** — optimality score, total cost, linked members
- **TeamMember** — assignment joining candidates to teams with their assigned role

> **Local fallback**: If PostgreSQL is not running, the backend automatically persists data to JSON files in `backend/data/`.

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK_DB` | `true` | Use JSON file storage instead of PostgreSQL |
| `USE_MOCK_CACHE` | `true` | Use in-memory Map instead of Redis |
| `DATABASE_URL` | local PG | PostgreSQL connection string |
| `ML_SERVICE_URL` | `http://localhost:8000` | FastAPI endpoint for ML calls |

---

## 📄 License
MIT
