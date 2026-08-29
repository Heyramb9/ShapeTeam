'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Cpu, Activity, Plus,
  DollarSign, CheckCircle2, AlertCircle, Loader2,
  Database, Sparkles, Check
} from 'lucide-react';
import apiService, { Project, Team } from '../services/api';

const AVAILABLE_ROLES = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'DESIGNER', label: 'UI Designer' },
  { value: 'DEVOPS', label: 'DevOps Engineer' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'PRODUCT_ANALYST', label: 'Product Analyst' },
  { value: 'ML_ENGINEER', label: 'ML Engineer' },
  { value: 'CLOUD_ENGINEER', label: 'Cloud Engineer' },
  { value: 'QA_ENGINEER', label: 'QA Engineer' },
  { value: 'TESTER', label: 'Tester' },
  { value: 'DATA_ANALYST', label: 'Data Analyst' }
];

export default function Dashboard() {
  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectTeams, setSelectedProjectTeams] = useState<Team[]>([]);
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newBudget, setNewBudget] = useState('150');
  const [newDeadline, setNewDeadline] = useState('12');
  const [newMinExp, setNewMinExp] = useState('3');
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  // Pipeline execution animation states
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<number>(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // UI message states
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch initial configuration
  useEffect(() => {
    fetchCandidatesCount();
    fetchProjectsList();
  }, []);

  // Fetch teams whenever a project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchProjectTeams(selectedProject.id);
    } else {
      setSelectedProjectTeams([]);
    }
  }, [selectedProject]);

  const fetchCandidatesCount = async () => {
    try {
      const res = await apiService.getCandidates();
      if (res.success) {
        setCandidateCount(res.count);
      }
    } catch (e: unknown) {
      console.error('Error fetching candidates:', e);
    }
  };

  const fetchProjectsList = async () => {
    setProjectsLoading(true);
    try {
      const res = await apiService.getProjects();
      if (res.success) {
        setProjects(res.projects);
      }
    } catch (e: unknown) {
      console.error('Error fetching projects:', e);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchProjectTeams = async (projectId: string) => {
    try {
      const res = await apiService.getProjectById(projectId);
      if (res.success) {
        setSelectedProjectTeams(res.teams || []);
      }
    } catch (e: unknown) {
      console.error('Error fetching teams:', e);
    }
  };

  const handleSyncCandidates = async () => {
    setSyncLoading(true);
    setNotification(null);
    try {
      const res = await apiService.syncCandidates();
      if (res.success) {
        setCandidateCount(res.count);
        showNotification('success', res.message);
      }
    } catch (e: unknown) {
      const err = e as Error;
      showNotification('error', err.message || 'Failed to sync candidate dataset.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (newRoles.length === 0) {
      showNotification('error', 'Please select at least one required role for the project.');
      return;
    }

    setCreateLoading(true);
    setNotification(null);
    try {
      const res = await apiService.createProject({
        title: newTitle,
        budgetLimit: parseFloat(newBudget),
        requiredRoles: newRoles,
        maxDeadlineWeeks: parseInt(newDeadline, 10),
        minExperience: parseFloat(newMinExp)
      });

      if (res.success) {
        setProjects([res.project, ...projects]);
        setSelectedProject(res.project);
        showNotification('success', 'Project requirement defined successfully.');
        
        // Reset form
        setNewTitle('');
        setNewRoles([]);
      }
    } catch (e: unknown) {
      const err = e as Error;
      showNotification('error', err.message || 'Failed to create project requirement.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (newRoles.includes(role)) {
      setNewRoles(newRoles.filter(r => r !== role));
    } else {
      setNewRoles([...newRoles, role]);
    }
  };

  const handleGenerateTeam = async () => {
    if (!selectedProject) return;
    setOptimizeLoading(true);
    setPipelineError(null);
    setPipelineStage(1); // Stage 1: ML Scoring

    try {
      // Simulate frontend steps to showcase backend algorithm stages
      await new Promise(r => setTimeout(r, 900));
      setPipelineStage(2); // Stage 2: Prolog Filter
      
      await new Promise(r => setTimeout(r, 900));
      setPipelineStage(3); // Stage 3: Candidate Pruning
      
      await new Promise(r => setTimeout(r, 900));
      setPipelineStage(4); // Stage 4: A* Decision Search
      
      const res = await apiService.generateTeam(selectedProject.id);
      
      await new Promise(r => setTimeout(r, 500));
      if (res.success) {
        setSelectedProjectTeams([res.team, ...selectedProjectTeams]);
        showNotification('success', res.fromCache ? 'Team loaded from optimization cache.' : 'Optimal team generated via hybrid search pipeline!');
      }
    } catch (e: unknown) {
      const err = e as Error;
      setPipelineError(err.message || 'Optimization failed to find a valid team under these constraints.');
      showNotification('error', err.message || 'Failed to optimize team composition.');
    } finally {
      setOptimizeLoading(false);
      setPipelineStage(0);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen pb-16 px-4 md:px-8 max-w-7xl mx-auto pt-6 font-sans">
      {/* Top Navigation / Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-violet-600/20 text-violet-400 rounded-lg border border-violet-500/20">🔮</span>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-violet-400 bg-clip-text text-transparent font-outfit">
              ShapeTeam
            </h1>
          </div>
          <p className="text-zinc-400 text-sm mt-1">Hybrid ML & Symbolic Logic Workforce Optimization Platform</p>
        </div>

        {/* Database Status and Sync Tool */}
        <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 px-4 py-3 rounded-xl glass-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Candidate Pool</div>
              <div className="text-lg font-bold text-white">
                {candidateCount > 0 ? `${candidateCount.toLocaleString()} Records` : 'Empty Database'}
              </div>
            </div>
          </div>
          <button
            onClick={handleSyncCandidates}
            disabled={syncLoading}
            className="ml-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-violet-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Sync Excel
              </>
            )}
          </button>
        </div>
      </header>

      {/* Global Alerts */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-md transition-all animate-bounce ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300 backdrop-blur-md' 
            : 'bg-rose-950/80 border-rose-500/30 text-rose-300 backdrop-blur-md'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
          <div className="text-sm font-medium">{notification.message}</div>
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input Form & Projects Selection */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Section: Create Project Requirement */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80">
            <h2 className="text-xl font-bold font-outfit mb-4 text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-400" />
              Define Requirements
            </h2>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Finance API Migration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Budget Limit ($/hr)</label>
                  <input
                    type="number"
                    min="10"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Min Experience (yrs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newMinExp}
                    onChange={(e) => setNewMinExp(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Max Duration (weeks)</label>
                <input
                  type="number"
                  min="1"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-2">Required Team Roles</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => handleRoleToggle(role.value)}
                      className={`flex items-center gap-2 p-1.5 rounded text-left text-xs font-medium transition-all ${
                        newRoles.includes(role.value)
                          ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                          : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 transition-all ${
                        newRoles.includes(role.value) ? 'opacity-100' : 'opacity-0'
                      }`} />
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 mt-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-violet-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Project
              </button>
            </form>
          </div>

          {/* Section: Project Select List */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 flex-1">
            <h2 className="text-xl font-bold font-outfit mb-4 text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-400" />
              Active Projects
            </h2>

            {projectsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <span className="text-zinc-500 text-xs font-medium">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-zinc-500 text-sm">No project definitions yet.</p>
                <p className="text-zinc-600 text-xs mt-1">Use the form above to add one.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedProject?.id === proj.id
                        ? 'bg-violet-600/10 border-violet-500/40 shadow-md shadow-violet-950/20'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/40 hover:border-zinc-800'
                    }`}
                  >
                    <div className="font-semibold text-sm text-white">{proj.title}</div>
                    <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
                      <span>Limit: ${proj.budgetLimit}/hr</span>
                      <span>Min Exp: {proj.minExperience} yrs</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.requiredRoles.map((role) => (
                        <span key={role} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] font-semibold tracking-wide rounded uppercase text-zinc-400">
                          {role.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Pipeline Progress & Team Optimization Dashboard */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {selectedProject ? (
            <>
              {/* Project Title Block & Optimizer Trigger */}
              <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-xs font-semibold text-violet-400 tracking-wider uppercase mb-1">Selected Project</div>
                  <h2 className="text-2xl font-bold font-outfit text-white">{selectedProject.title}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Budget limit: <strong>${selectedProject.budgetLimit}/hr</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Roles Needed: <strong>{selectedProject.requiredRoles.length}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      Min Experience: <strong>{selectedProject.minExperience} years</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateTeam}
                  disabled={optimizeLoading || candidateCount === 0}
                  className="px-6 py-3 w-full md:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-950/40 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {optimizeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Optimizing Pipeline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                      Generate Optimal Team
                    </>
                  )}
                </button>
              </div>

              {/* Pipeline Simulation Loader (If optimising) */}
              {optimizeLoading && (
                <div className="glass-panel rounded-2xl p-8 border border-violet-500/20 relative overflow-hidden pulse-glow">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Cpu className="w-48 h-48 animate-spin-slow" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit text-white mb-6 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-400 animate-spin" />
                    Executing Hybrid Optimization Pipeline
                  </h3>
                  
                  {/* Stages */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                    
                    <div className={`p-4 rounded-xl border transition-all ${
                      pipelineStage >= 1
                        ? 'bg-violet-950/40 border-violet-500/40 text-white'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">Stage 1</span>
                        {pipelineStage > 1 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : pipelineStage === 1 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        ) : null}
                      </div>
                      <div className="font-semibold text-xs mb-1">ML Layer Scoring</div>
                      <p className="text-[10px] text-zinc-400 leading-tight">Runs candidates through K-Means & Decision Tree regressors.</p>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${
                      pipelineStage >= 2
                        ? 'bg-violet-950/40 border-violet-500/40 text-white'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">Stage 2</span>
                        {pipelineStage > 2 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : pipelineStage === 2 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        ) : null}
                      </div>
                      <div className="font-semibold text-xs mb-1">Symbolic Logic</div>
                      <p className="text-[10px] text-zinc-400 leading-tight">Applies Prolog eligibility rules checking cost & experience.</p>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${
                      pipelineStage >= 3
                        ? 'bg-violet-950/40 border-violet-500/40 text-white'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">Stage 3</span>
                        {pipelineStage > 3 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : pipelineStage === 3 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        ) : null}
                      </div>
                      <div className="font-semibold text-xs mb-1">Candidate Pruning</div>
                      <p className="text-[10px] text-zinc-400 leading-tight">Limits search space pool to top 5,000 scoring fits.</p>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${
                      pipelineStage >= 4
                        ? 'bg-violet-950/40 border-violet-500/40 text-white'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-600'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">Stage 4</span>
                        {pipelineStage === 4 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        ) : null}
                      </div>
                      <div className="font-semibold text-xs mb-1">A* Search Space</div>
                      <p className="text-[10px] text-zinc-400 leading-tight">State space search for cheapest-max-fit team configuration.</p>
                    </div>

                  </div>
                </div>
              )}

              {/* Search Failure View */}
              {pipelineError && (
                <div className="bg-rose-950/40 border border-rose-500/30 p-5 rounded-2xl text-rose-300 text-sm flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Team Optimization Failed</div>
                    <p className="text-xs text-rose-400 mt-1">{pipelineError}</p>
                    <p className="text-[10px] text-rose-500 mt-2 font-medium">Tip: Try increasing the hourly budget limit or reducing the minimum experience requirement.</p>
                  </div>
                </div>
              )}

              {/* Optimization Result Display */}
              {selectedProjectTeams.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {selectedProjectTeams.map((team, idx) => {
                    const budgetUsagePercent = Math.min(100, Math.round((team.totalCost / selectedProject.budgetLimit) * 100));
                    
                    return (
                      <div key={team.id} className="glass-panel rounded-2xl border border-zinc-800/80 overflow-hidden">
                        {/* Header Stats */}
                        <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              {idx === 0 ? 'Optimal Solution' : `Alternative #${idx + 1}`}
                            </span>
                            <div className="text-zinc-500 text-[10px] font-medium uppercase mt-1">Optimization ID</div>
                            <div className="text-xs font-mono text-zinc-300">{team.id}</div>
                          </div>

                          <div className="flex items-center gap-8">
                            {/* Optimality Metric */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center relative overflow-hidden" style={{
                                borderColor: team.optimalityScore > 85 ? '#8b5cf6' : team.optimalityScore > 70 ? '#6366f1' : '#4b5563'
                              }}>
                                <span className="text-xs font-bold text-white">{Math.round(team.optimalityScore)}%</span>
                              </div>
                              <div>
                                <div className="text-[10px] text-zinc-400 font-medium uppercase">Optimality Score</div>
                                <div className="text-xs font-bold text-zinc-300">Heuristic Index</div>
                              </div>
                            </div>

                            {/* Cost Metric */}
                            <div>
                              <div className="text-[10px] text-zinc-400 font-medium uppercase">Total Cost</div>
                              <div className="text-lg font-black text-white">${team.totalCost}/hr</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${budgetUsagePercent}%` }} />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold">{budgetUsagePercent}% budget</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Team Members List */}
                        <div className="p-6">
                          <h3 className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">Recommended Team Configuration</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.members?.map((member) => {
                              const candidate = member.candidate || {};
                              return (
                                <div key={member.id} className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                    {candidate.fullName ? candidate.fullName.split('_')[1] || candidate.fullName.charAt(0) : '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <div className="font-bold text-sm text-white truncate">{candidate.fullName}</div>
                                      {candidate.fitScore !== null && (
                                        <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-300 text-[9px] font-bold rounded border border-violet-500/20">
                                          Fit: {Math.round(candidate.fitScore)}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mt-0.5">
                                      {member.assignedRole.replace('_', ' ')}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-900 text-[10px] text-zinc-500">
                                      <span>Exp: <strong>{candidate.experienceYears} yrs</strong></span>
                                      <span>Cost: <strong>${candidate.costPerHour}/hr</strong></span>
                                      <span>Cluster: <strong>{candidate.clusterId ?? 'None'}</strong></span>
                                    </div>
                                    
                                    {/* Skill Tags */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {candidate.skills?.map((skill: string) => (
                                        <span key={skill} className="px-1 py-0.5 bg-zinc-900 text-zinc-400 text-[8px] font-bold tracking-wide rounded">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !optimizeLoading ? (
                <div className="glass-panel rounded-2xl p-12 text-center border border-zinc-800/80 flex flex-col items-center justify-center">
                  <div className="p-4 bg-violet-500/10 text-violet-400 rounded-full mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold font-outfit text-white mb-2">No Optimized Team Configured</h3>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto">
                    Click the &quot;Generate Optimal Team&quot; button above to run the hybrid predictive scoring and decision search pipeline for this project.
                  </p>
                </div>
              ) : null}

            </>
          ) : (
            <div className="glass-panel rounded-2xl p-16 text-center border border-zinc-800/80 flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="p-4 bg-zinc-900 text-zinc-500 rounded-full mb-4 border border-zinc-800">
                <Briefcase className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-white mb-2">No Project Selected</h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                Select a project requirement from the left sidebar list or define a new one to optimize team structures.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
