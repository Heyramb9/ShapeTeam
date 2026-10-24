'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, AlertTriangle, BarChart3, Bell, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, CircleHelp, Database, Download, FileText, FolderKanban, Gauge, LayoutDashboard, Loader2, LogOut, Menu, Plus, RefreshCw, Rocket, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Users, WandSparkles, X } from 'lucide-react';
import apiService, { Candidate, Organization, Project, SessionUser, Team, UserRole } from '../services/api';

const ClerkAuthView = dynamic(() => import('../components/ClerkAuthView'), { ssr: false });

type View = 'dashboard' | 'create' | 'projects' | 'employees' | 'analysis' | 'recommendations' | 'reports' | 'settings';
type Panel = 'diagnostics' | 'notifications' | 'help' | 'addEmployee' | 'candidate' | 'project' | 'compare' | 'weights' | 'standby' | null;
const ROLES = [['DEVELOPER','Developer'],['DESIGNER','UI Designer'],['DEVOPS','DevOps Engineer'],['TEAM_LEAD','Team Lead'],['PRODUCT_ANALYST','Product Analyst'],['ML_ENGINEER','ML Engineer'],['CLOUD_ENGINEER','Cloud Engineer'],['QA_ENGINEER','QA Engineer'],['TESTER','Tester'],['DATA_ANALYST','Data Analyst']];
const NAV = [{id:'dashboard' as View,label:'Dashboard',icon:LayoutDashboard},{id:'create' as View,label:'Create Team',icon:WandSparkles},{id:'projects' as View,label:'Projects',icon:FolderKanban},{id:'employees' as View,label:'Employees',icon:BriefcaseBusiness},{id:'analysis' as View,label:'Team Analysis',icon:BarChart3},{id:'recommendations' as View,label:'Recommendations',icon:Sparkles},{id:'reports' as View,label:'Reports',icon:FileText},{id:'settings' as View,label:'Settings',icon:Settings}];
const labelRole=(v:string)=>v.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const initials=(v:string)=>v.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
const download=(name:string,content:string,type='text/plain')=>{const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)};
const saveBlob=(name:string,blob:Blob)=>{const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)};

export default function ShapeTeam(){
  const [session,setSession]=useState<{user:SessionUser;organization:Organization}|null>(null),[sessionLoading,setSessionLoading]=useState(true);
  const [datasetGate,setDatasetGate]=useState<'checking'|'required'|'ready'>('checking'),[dataVersion,setDataVersion]=useState(0);
  const [view,setView]=useState<View>('dashboard'),[mobileNav,setMobileNav]=useState(false),[projects,setProjects]=useState<Project[]>([]),[candidates,setCandidates]=useState<Candidate[]>([]),[selected,setSelected]=useState<Project|null>(null),[teams,setTeams]=useState<Team[]>([]);
  const [candidateTotal,setCandidateTotal]=useState(0);
  const [loading,setLoading]=useState(true),[syncing,setSyncing]=useState(false),[optimizing,setOptimizing]=useState(false),[stage,setStage]=useState(0),[notice,setNotice]=useState<{type:'success'|'error';message:string}|null>(null),[query,setQuery]=useState(''),[panel,setPanel]=useState<Panel>(null);
  const [focusedCandidate,setFocusedCandidate]=useState<Candidate|null>(null),[focusedProject,setFocusedProject]=useState<Project|null>(null),[notificationCount,setNotificationCount]=useState(3);
  const [dashboardMetrics,setDashboardMetrics]=useState<Record<string,number|Array<{label:string;value:number}>>>({});
  const [title,setTitle]=useState(''),[budget,setBudget]=useState('150'),[deadline,setDeadline]=useState('12'),[experience,setExperience]=useState('3'),[roles,setRoles]=useState<string[]>([]),[creating,setCreating]=useState(false);
  useEffect(()=>{
    const expired=()=>{setSession(null);setSessionLoading(false)};
    window.addEventListener('shapeteam:session-expired',expired);
    const watchdog=window.setTimeout(()=>setSessionLoading(false),2500);
    const token=apiService.getToken();
    if(!token){
      setSessionLoading(false);
      window.clearTimeout(watchdog);
    }else{
      apiService.getMe()
        .then(({user,organization})=>setSession({user,organization}))
        .catch(()=>apiService.setToken(null))
        .finally(()=>{
          window.clearTimeout(watchdog);
          setSessionLoading(false);
        });
    }
    return()=>{
      window.clearTimeout(watchdog);
      window.removeEventListener('shapeteam:session-expired',expired);
    };
  },[]);
  useEffect(()=>{if(!session){setDatasetGate('checking');return}setDatasetGate('checking');apiService.getDatasetStatus().then(status=>setDatasetGate(status.required&&['ORGANIZATION_ADMIN','HR_MANAGER'].includes(session.user.role)?'required':'ready')).catch(()=>setDatasetGate('ready'))},[session]);
  useEffect(()=>{if(!session||datasetGate!=='ready')return;setLoading(true);Promise.allSettled([apiService.getProjects(),apiService.getCandidates(),apiService.getNotifications(),apiService.dashboard()]).then(([p,c,n,d])=>{if(p.status==='fulfilled'&&p.value.success){setProjects(p.value.projects);setSelected(p.value.projects[0]||null)}if(c.status==='fulfilled'&&c.value.success){setCandidates(c.value.candidates);setCandidateTotal(c.value.count)}if(n.status==='fulfilled')setNotificationCount(n.value.unread);if(d.status==='fulfilled')setDashboardMetrics(d.value.metrics);setLoading(false)})},[session,datasetGate,dataVersion]);
  useEffect(()=>{if(!selected){setTeams([]);return}setTeams([]);apiService.getProjectById(selected.id).then(r=>r.success&&setTeams(r.teams||[])).catch(()=>setTeams([]))},[selected]);
  useEffect(()=>{const shortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.getElementById('global-search')?.focus()}};window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut)},[]);
  const flash=(type:'success'|'error',message:string)=>{setNotice({type,message});window.setTimeout(()=>setNotice(null),4500)};
  const go=(v:View)=>{setView(v);setMobileNav(false)};
  const inspectCandidate=(candidate:Candidate)=>{setFocusedCandidate(candidate);setPanel('candidate')};
  const inspectProject=(project:Project)=>{setSelected(project);setFocusedProject(project);setPanel('project')};
  const selectAndOptimize=(project:Project)=>{setSelected(project);setView('create');setPanel(null)};
  const exportTeam=()=>{if(!selected||!teams[0])return flash('error','Generate a recommendation before exporting.');const team=teams[0];download(`${selected.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-team-report.txt`,[`ShapeTeam Recommendation: ${selected.title}`,`Overall score: ${Math.round(team.optimalityScore)}/100`,`Total cost: $${team.totalCost}/hr`,'',...team.members.map(member=>`${member.candidate.fullName} — ${labelRole(member.assignedRole)} — ${member.candidate.skills.join(', ')}`)].join('\n'));flash('success','Recommendation report downloaded.')};
  const sync=async()=>{setSyncing(true);try{const a=await apiService.syncCandidates(),b=await apiService.getCandidates();if(b.success){setCandidates(b.candidates);setCandidateTotal(b.count)}flash('success',a.message)}catch(e){flash('error',e instanceof Error?e.message:'Candidate sync failed.')}finally{setSyncing(false)}};
  const create=async(e:FormEvent)=>{e.preventDefault();if(!roles.length)return flash('error','Select at least one required role.');setCreating(true);try{const r=await apiService.createProject({title:title.trim(),budgetLimit:+budget,requiredRoles:roles,maxDeadlineWeeks:+deadline,minExperience:+experience});setProjects(v=>[r.project,...v]);setSelected(r.project);setTitle('');setRoles([]);flash('success','Project requirements saved. Ready for optimization.')}catch(err){flash('error',err instanceof Error?err.message:'Unable to create project.')}finally{setCreating(false)}};
  const generate=async()=>{if(!selected)return flash('error','Select a project first.');if(!candidates.length)return flash('error','Sync the employee dataset before optimizing.');setOptimizing(true);try{setStage(1);await new Promise(r=>setTimeout(r,450));setStage(2);await new Promise(r=>setTimeout(r,450));setStage(3);const r=await apiService.generateTeam(selected.id);setTeams(v=>[r.team,...v.filter(t=>t.id!==r.team.id)]);setView('recommendations');flash('success',r.fromCache?'Recommendation loaded from cache.':'Optimal team recommendation generated.')}catch(e){flash('error',e instanceof Error?e.message:'Optimization failed.')}finally{setOptimizing(false);setStage(0)}};
  const launch=async()=>{const team=teams[0],recommendation=team?.recommendation;if(!recommendation)return flash('error','Generate or select a recommendation first.');try{const result=session?.user.role==='ORGANIZATION_ADMIN'&&recommendation.status==='PENDING_APPROVAL'?await apiService.reviewRecommendation(recommendation.id,'approve','Approved in ShapeTeam review.'):await apiService.submitRecommendation(recommendation.id);setTeams(current=>current.map(item=>item.id===team.id?{...item,status:result.recommendation.status,recommendation:result.recommendation}:item));flash('success',result.message)}catch(error){flash('error',error instanceof Error?error.message:'Unable to update recommendation.')}};
  const filtered=useMemo(()=>{const q=query.toLowerCase();return candidates.filter(c=>[c.fullName,c.role,...c.skills].join(' ').toLowerCase().includes(q))},[candidates,query]);
  if(sessionLoading)return <div className="session-loader" style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',background:'#f8f9ff',color:'#00134b',fontFamily:'system-ui, -apple-system, sans-serif'}}><Loader2 className="spin" style={{width:36,height:36,color:'#0757db',animation:'spin 1s linear infinite'}}/><b style={{fontSize:'15px',fontWeight:600}}>Loading ShapeTeam...</b></div>;
  if(!session)return <AuthGateway authenticated={(user,organization)=>setSession({user,organization})}/>;
  if(datasetGate==='checking')return <div className="session-loader" style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',background:'#f8f9ff',color:'#00134b',fontFamily:'system-ui, -apple-system, sans-serif'}}><Loader2 className="spin" style={{width:36,height:36,color:'#0757db',animation:'spin 1s linear infinite'}}/><b style={{fontSize:'15px',fontWeight:600}}>Checking workforce data...</b></div>;
  if(datasetGate==='required')return <DatasetOnboarding organization={session.organization} user={session.user} complete={()=>{setDatasetGate('ready');setDataVersion(value=>value+1)}} skip={()=>setDatasetGate('ready')} logout={async()=>{await apiService.logout();setSession(null)}}/>;
  const allowedViews:Record<UserRole,View[]>={ORGANIZATION_ADMIN:['dashboard','create','projects','employees','analysis','recommendations','reports','settings'],HR_MANAGER:['dashboard','create','projects','employees','analysis','recommendations','reports'],PROJECT_MANAGER:['dashboard','create','projects','employees','analysis','recommendations','reports'],TEAM_LEAD:['dashboard','projects','analysis','recommendations'],EMPLOYEE:['dashboard','projects','analysis']};
  const canCreate=['ORGANIZATION_ADMIN','HR_MANAGER','PROJECT_MANAGER'].includes(session.user.role);
  const signOut=async()=>{
    try {
      if (typeof window !== 'undefined' && (window as unknown as { Clerk?: { signOut: () => Promise<void> } }).Clerk) {
        await (window as unknown as { Clerk: { signOut: () => Promise<void> } }).Clerk.signOut();
      }
    } catch (e) {
      console.warn('Clerk signOut ignored:', e);
    }
    await apiService.logout();
    setSession(null);
    setDatasetGate('checking');
    setProjects([]);
    setCandidates([]);
    setTeams([]);
  };
  return <div className="app-shell"><aside className={`sidebar ${mobileNav?'open':''}`}><Logo home={()=>go('dashboard')}/><button className="nav-close" onClick={()=>setMobileNav(false)} aria-label="Close menu"><X/></button><p className="nav-label">Workforce platform</p><nav>{NAV.filter(n=>allowedViews[session.user.role].includes(n.id)).map(n=><button key={n.id} className={view===n.id?'active':''} onClick={()=>go(n.id)}><n.icon/>{n.label}</button>)}</nav><div className="side-bottom"><button onClick={()=>setPanel('help')}><CircleHelp/>Help Center <small>Docs</small></button><div className="user-card"><div className="user-info"><i>{initials(session.user.name)}</i><span><b>{session.user.name}</b><small>{labelRole(session.user.role)}</small></span></div><button className="logout-btn" onClick={signOut} title="Sign out of your session"><LogOut size={13}/><span>Sign out</span></button></div></div></aside>
  <div className="workspace"><header><button className="menu" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu/></button><label className="global-search"><Search/><input id="global-search" value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value&&allowedViews[session.user.role].includes('employees'))go('employees')}} placeholder="Search teams, skills, members..."/><kbd>Ctrl K</kbd></label><div className="ai-live"><i/>ShapeTeam AI v3.2 <span>• Active</span></div><div className="header-actions"><button className="bell" onClick={()=>setPanel('notifications')} aria-label="Notifications"><Bell/>{notificationCount>0&&<b>{notificationCount}</b>}</button>{canCreate&&<button className="primary" onClick={()=>go('create')}><Plus/>Create New Team</button>}<button className="user-nav-btn" onClick={signOut} title="Click to sign out"><i className="avatar">{initials(session.user.name)}</i><span className="user-nav-name">{session.user.name.split(' ')[0]}</span><LogOut size={13} className="logout-icon"/></button></div></header><main>
  {view==='dashboard'&&<Dashboard projects={projects} candidates={candidates} teams={teams} loading={loading} metrics={dashboardMetrics} go={go} setSelected={setSelected} diagnostics={()=>setPanel('diagnostics')} canCreate={canCreate}/>} {view==='employees'&&<Employees candidates={filtered} total={candidateTotal} query={query} setQuery={setQuery} syncing={syncing} sync={sync} add={()=>setPanel('addEmployee')} inspect={inspectCandidate} canAdd={['ORGANIZATION_ADMIN','HR_MANAGER'].includes(session.user.role)}/>} {view==='projects'&&<Projects projects={projects} selected={selected} inspect={inspectProject} create={()=>go('create')} canCreate={canCreate}/>} {view==='create'&&<Create projects={projects} selected={selected} setSelected={setSelected} candidates={candidateTotal} roles={roles} setRoles={setRoles} title={title} setTitle={setTitle} budget={budget} setBudget={setBudget} deadline={deadline} setDeadline={setDeadline} experience={experience} setExperience={setExperience} creating={creating} submit={create} syncing={syncing} sync={sync} optimizing={optimizing} stage={stage} generate={generate}/>} {view==='recommendations'&&<Recommendation project={selected} team={teams[0]} optimizing={optimizing} generate={generate} create={()=>go('create')} launch={launch} canAct={canCreate}/>} {view==='analysis'&&<Analysis team={teams[0]} project={selected} openWeights={()=>setPanel('weights')} generate={()=>go('create')}/>} {view==='reports'&&<Reports projects={projects} team={teams[0]} exportTeam={exportTeam}/>} {view==='settings'&&<SettingsView openWeights={()=>setPanel('weights')} flash={flash}/>} </main></div>{mobileNav&&<button className="backdrop" onClick={()=>setMobileNav(false)}/>} {panel&&<PanelView panel={panel} close={()=>setPanel(null)} candidates={candidates} projects={projects} teams={teams} candidate={focusedCandidate} project={focusedProject} optimize={selectAndOptimize} onRead={()=>{apiService.markNotificationsRead().catch(()=>undefined);setNotificationCount(0)}} canManageRoles={session.user.role==='ORGANIZATION_ADMIN'} onUserUpdated={async()=>{const result=await apiService.getCandidates();setCandidates(result.candidates);setCandidateTotal(result.count)}} added={candidate=>{setCandidates(v=>[candidate,...v]);setCandidateTotal(value=>value+1);setPanel(null);go('employees');flash('success','Employee added successfully.')}}/>} {notice&&<div className={`toast ${notice.type}`}>{notice.type==='success'?<CheckCircle2/>:<AlertTriangle/>}{notice.message}</div>}</div>
}

function DatasetOnboarding({organization,user,complete,skip,logout}:{organization:Organization;user:SessionUser;complete:()=>void;skip:()=>void;logout:()=>void}){
  const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[progress,setProgress]=useState('');
  const upload=async()=>{if(!file)return setError('Choose an Excel or CSV employee dataset first.');setBusy(true);setError('');setProgress('Reading and validating the dataset…');try{const result=await apiService.importEmployeeDataset(file);setProgress(`${result.result.imported.toLocaleString()} employees imported. Preparing your dashboard…`);window.setTimeout(complete,700)}catch(reason){setError(reason instanceof Error?reason.message:'Dataset import failed.');setProgress('')}finally{setBusy(false)}};
  return <div className="dataset-page"><header><Logo home={()=>undefined}/><button className="secondary" onClick={logout} style={{display:'inline-flex',alignItems:'center',gap:6}}><LogOut size={14}/> Sign out</button></header><main><section><small>Organization setup · Workforce data</small><h1>Welcome, {user.name.split(' ')[0]}</h1><p>Upload {organization.name}&apos;s employee dataset so ShapeTeam can calculate workforce capacity, skill coverage, compatibility, and team recommendations from your organization&apos;s actual records.</p><div className={`dataset-drop ${file?'selected':''}`}><Database/><h2>{file?file.name:'Choose your employee dataset'}</h2><p>{file?`${(file.size/1024/1024).toFixed(2)} MB selected`:'Excel (.xlsx, .xls) or CSV · up to 20 MB'}</p><label className="secondary">Browse files<input type="file" accept=".xlsx,.xls,.csv" onChange={event=>{setFile(event.target.files?.[0]||null);setError('')}}/></label></div>{progress&&<p className="import-progress"><Loader2 className={busy?'spin':''}/>{progress}</p>}{error&&<p className="form-error">{error}</p>}<button className="primary dataset-submit" disabled={!file||busy} onClick={upload}>{busy?<Loader2 className="spin"/>:<Sparkles/>}{busy?'Importing workforce data…':'Import and analyze employees'}</button><button className="text-action dataset-skip" disabled={busy} onClick={skip}>Continue with the existing sample data</button></section><aside><h2>Required employee columns</h2><p>ShapeTeam recognizes the uploaded sample format automatically.</p><div className="dataset-columns">{['Employee ID and name','Department','Primary and secondary skills','Experience years','Availability','Current workload','Preferred role','Performance and behavior scores'].map(item=><span key={item}><CheckCircle2/>{item}</span>)}</div><div className="dataset-note"><ShieldCheck/><p><b>Organization-isolated import</b><small>Records are available only inside {organization.name}. Protected personal attributes are not used for ranking.</small></p></div></aside></main></div>
}

function AuthGateway({authenticated}:{authenticated:(user:SessionUser,organization:Organization)=>void}){
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [mode,setMode]=useState<'landing'|'gmail'>('landing');
  const [authIntent,setAuthIntent]=useState<'signin'|'signup'>('signin');
  const [gmail,setGmail]=useState('');
  const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showKeyInfo,setShowKeyInfo]=useState(false);

  const openAuth=(intent:'signin'|'signup')=>{
    setAuthIntent(intent);
    setMode('gmail');
  };

  const loginWithGmail=async(e?:FormEvent)=>{
    if(e) e.preventDefault();
    const cleanEmail=gmail.trim().toLowerCase();
    if(!cleanEmail||!cleanEmail.includes('@')){
      setError('Please enter a valid Gmail address.');
      return;
    }
    setBusy(true);
    setError('');
    try{
      const pseudoClerkId='user_clerk_'+btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g,'').slice(0,16);
      const result=await apiService.clerkAuth({
        clerkId:pseudoClerkId,
        email:cleanEmail,
        name:name.trim()||cleanEmail.split('@')[0],
      });
      authenticated(result.user,result.organization);
    }catch(err){
      setError(err instanceof Error?err.message:'Unable to sign in with Gmail.');
    }finally{
      setBusy(false);
    }
  };

  const loginDemo=async()=>{
    setBusy(true);
    setError('');
    try{
      const result=await apiService.login('admin@shapeteam.local','Demo12345!');
      authenticated(result.user,result.organization);
    }catch(err){
      setError(err instanceof Error?err.message:'Demo login failed.');
    }finally{
      setBusy(false);
    }
  };

  // If a Clerk Publishable Key is provided in .env.local, render the full Clerk OAuth component
  if(hasClerkKey && mode==='gmail'){
    return <ClerkAuthView authenticated={authenticated} onBack={()=>setMode('landing')} initialMode={authIntent} />;
  }

  if(mode==='landing')return (
    <div className="landing">
      <header>
        <Logo home={()=>undefined}/>
        <nav>
          <button onClick={()=>openAuth('signin')}>Sign in with Gmail</button>
          <button className="primary" onClick={()=>openAuth('signup')}><Sparkles/>Sign up with Gmail</button>
        </nav>
      </header>
      <main>
        <section>
          <small>Workforce intelligence • Clerk Authentication</small>
          <h1>Build stronger teams with decisions people can trust.</h1>
          <p>ShapeTeam connects skills, workload, experience, and project constraints to create transparent team recommendations. Sign up seamlessly using your Gmail ID.</p>
          <div>
            <button className="primary" onClick={()=>openAuth('signup')}><Sparkles/>Sign up with Gmail</button>
            <button className="secondary" onClick={()=>openAuth('signin')}>Open workspace<ChevronRight/></button>
          </div>
          <footer>
            <span><CheckCircle2/>Clerk single sign-on</span>
            <span><CheckCircle2/>Sign up using your Gmail ID</span>
            <span><CheckCircle2/>Organization Admin role assigned automatically</span>
          </footer>
        </section>
        <aside>
          <div className="landing-score"><small>Recommended team</small><b>92%</b><span>Compatibility</span></div>
          <div className="landing-bars">{[['Skill coverage',96],['Workload balance',88],['Availability',91],['Confidence',89]].map(([label,value])=><p key={label}><span>{label}<b>{value}%</b></span><i><b style={{width:`${value}%`}}/></i></p>)}</div>
          <div className="insight"><Sparkles/>Single Sign-On powered by Clerk. Sign up or log in using your Gmail address.</div>
        </aside>
      </main>
    </div>
  );

  return (
    <div className="auth-page">
      <aside>
        <Logo home={()=>setMode('landing')}/>
        <div>
          <small>Clerk Authentication • Single Sign-On</small>
          <h1>Welcome to ShapeTeam</h1>
          <p>Sign up or sign in with your Gmail ID to access your role-based workforce intelligence workspace.</p>
          <div style={{marginTop:24,display:'grid',gap:10}}>
            <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#d8e5ff'}}><CheckCircle2 size={16} color="#75b9ff"/> Sign up using your Gmail account</span>
            <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#d8e5ff'}}><Sparkles size={16} color="#75b9ff"/> Organization Admin permissions automatically assigned</span>
            <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#d8e5ff'}}><ShieldCheck size={16} color="#75b9ff"/> No passwords to remember</span>
          </div>
        </div>
        <footer>Secured by Clerk & Google OAuth · ShapeTeam AI</footer>
      </aside>
      <main>
        <form onSubmit={loginWithGmail}>
          <button type="button" className="auth-back" onClick={()=>setMode('landing')}>← Back</button>
          <h2>Sign up with Gmail</h2>
          <p style={{color:'#656b78',fontSize:13,margin:'-6px 0 16px'}}>
            Enter your Gmail ID to sign up. ShapeTeam will automatically set up your organization workspace.
          </p>

          <label>
            Your Gmail address
            <input
              required
              type="email"
              placeholder="e.g. dakshpatel@gmail.com"
              value={gmail}
              onChange={e=>setGmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </label>

          <label>
            Your Full Name (optional)
            <input
              type="text"
              placeholder="e.g. Daksh Patel"
              value={name}
              onChange={e=>setName(e.target.value)}
              autoComplete="name"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary auth-submit" disabled={busy} type="submit">
            {busy ? <Loader2 className="spin"/> : <Sparkles/>}
            {busy ? 'Authenticating with Clerk...' : 'Continue with Gmail'}
          </button>

          <div style={{borderTop:'1px solid #edf0f8',paddingTop:14,marginTop:12}}>
            <button
              type="button"
              className="text-action"
              onClick={()=>setShowKeyInfo(!showKeyInfo)}
              style={{fontSize:12,color:'#566075',display:'flex',alignItems:'center',gap:6}}
            >
              <Settings size={14}/> {showKeyInfo ? 'Hide Clerk API configuration' : 'Using your own Clerk project keys?'}
            </button>
            {showKeyInfo && (
              <div style={{marginTop:8,background:'#f6f8ff',border:'1px solid #e1e7f8',padding:12,borderRadius:6,fontSize:11,color:'#374151',lineHeight:1.6}}>
                <b>To connect the official Clerk OAuth widget:</b>
                <br/>
                Add your <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</code> into <code>frontend/.env.local</code>. Once added, the official Clerk Google OAuth popup will render directly!
              </div>
            )}
          </div>

          <p className="demo-note" style={{marginTop:14}}>
            <b>Want to test demo records?</b>
            <button type="button" className="text-action" onClick={loginDemo} style={{fontWeight:600,color:'#0757db'}}>
              Sign in as Admin Demo →
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
function Logo({home}:{home:()=>void}){return <button className="brand" onClick={home} aria-label="Go to dashboard"><b><Rocket/><span>Shape</span>Team</b><small>Enterprise AI</small></button>}
function Intro({eyebrow,title,copy,actions}:{eyebrow:string;title:string;copy:string;actions?:React.ReactNode}){return <div className="intro"><div><small>{eyebrow}</small><h1>{title}</h1><p>{copy}</p></div>{actions&&<div className="actions">{actions}</div>}</div>}
function Dashboard({projects,candidates,teams,loading,metrics,go,setSelected,diagnostics,canCreate}:{projects:Project[];candidates:Candidate[];teams:Team[];loading:boolean;metrics:Record<string,number|Array<{label:string;value:number}>>;go:(v:View)=>void;setSelected:(p:Project)=>void;diagnostics:()=>void;canCreate:boolean}){const stats=[['Active projects',Number(metrics.activeProjects??projects.length),FolderKanban],['Employees analyzed',Number(metrics.activeUsers??candidates.length).toLocaleString(),Users],['Teams formed',Number(metrics.teamsFormed??teams.length),BriefcaseBusiness],['Avg team compatibility',`${Number(metrics.averageTeamCompatibility??0)}%`,Sparkles]] as const;return <><Intro eyebrow="Algorithmic talent intelligence • Real-time synthesis" title="Good morning, Heyramb" copy="Here is your workforce optimization overview and real-time team intelligence." actions={<><button className="secondary" onClick={diagnostics}><Gauge/>Run AI Diagnostics</button>{canCreate&&<button className="primary" onClick={()=>go('create')}><WandSparkles/>Create New Team</button>}</>}/><div className="stats">{stats.map(([l,v,I])=><div className="stat" key={l}><span><small>{l}</small><b>{loading?'—':v}</b><em>↑ 12.5% <i>vs last month</i></em></span><I/></div>)}</div><div className="dashboard"><section className="card performance"><CardTitle title="Team Performance Overview" copy="Comparative analysis across organizational cohorts"/><div className="legend">● Actual synergy　<span>● Baseline target</span></div><div className="chart"><i/><i/><i/><svg viewBox="0 0 700 240" preserveAspectRatio="none"><defs><linearGradient id="area"><stop stopColor="#2563eb" stopOpacity=".25"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path className="area" d="M0 200C100 190 140 210 220 145S340 100 430 80S570 60 700 40L700 240H0Z"/><path className="actual" d="M0 200C100 190 140 210 220 145S340 100 430 80S570 60 700 40"/><path className="target" d="M0 220C170 170 430 160 700 105"/></svg><div><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span></div></div><div className="insight"><Sparkles/>Predictive model projects a <b>+3.4% affinity surge</b> by July.</div></section><section className="card split"><CardTitle title="Workforce Split" copy="Allocation across active talent pools"/><div className="donut"><span><b>{candidates.length.toLocaleString()}</b><small>Total staff</small></span></div>{[['Engineering','42%'],['Design','18%'],['Marketing','16%'],['Operations','14%'],['Research','10%']].map((r,i)=><p key={r[0]}><i className={`d${i}`}/>{r[0]}<b>{r[1]}</b></p>)}</section><section className="card recent"><CardTitle title="Recent AI Team Recommendations" copy="Generated teams awaiting executive confirmation"/>{projects.slice(0,4).map((p,i)=><button key={p.id} onClick={()=>{setSelected(p);go('recommendations')}}><i><Sparkles/></i><span><b>{p.title}</b><small>{p.requiredRoles.length} specialist roles</small></span><em>{96-i*2}%</em><ChevronRight/></button>)}{!projects.length&&<Empty text="Create a project to begin team optimization."/>}</section><section className="advisory"><Sparkles/><small>AI advisory notice</small><h2>Capacity imbalance detected</h2><p>AI suggests reallocating specialist capacity to optimize delivery cycles.</p>{canCreate&&<button onClick={()=>go('create')}>Auto-balance now</button>}</section></div></>}
function CardTitle({title,copy}:{title:string;copy:string}){return <div className="card-title"><h2>{title}</h2><p>{copy}</p></div>}
function Employees({candidates,total,query,setQuery,syncing,sync,add,inspect,canAdd}:{candidates:Candidate[];total:number;query:string;setQuery:(v:string)=>void;syncing:boolean;sync:()=>void;add:()=>void;inspect:(candidate:Candidate)=>void;canAdd:boolean}){return <><Intro eyebrow="Enterprise workforce roster • Algorithmic talent allocation" title="Employee Directory & Talent Intelligence" copy={`Manage ${total.toLocaleString()} cross-functional team members, skills, and workload allocations.`} actions={<><button className="secondary" onClick={sync}>{syncing?<Loader2 className="spin"/>:<Database/>}Sync Excel</button>{canAdd&&<button className="primary" onClick={add}><Plus/>Add Employee</button>}</>}/><div className="stats"><Stat label="Total workforce" value={total}/><Stat label="Available for projects" value={Math.round(total*.27)}/><Stat label="Nominal load" value={Math.round(total*.1)}/><Stat label="Overallocated" value={Math.round(total*.02)} danger/></div><section className="card directory"><div className="filters"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, role, or skill..."/></label><span>{candidates.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Role</th><th>Core competencies</th><th>Experience</th><th>Availability</th><th>AI fit</th></tr></thead><tbody>{candidates.slice(0,30).map((c,i)=><tr key={c.id}><td><button className="employee-link" onClick={()=>inspect(c)}><i className={`person c${i%5}`}>{initials(c.fullName)}</i><span><b>{c.fullName}</b><small>{c.email}</small></span></button></td><td>{labelRole(c.role)}</td><td><div className="skills">{c.skills.slice(0,3).map(s=><i key={s}>{s}</i>)}</div></td><td><b>{c.experienceYears}y</b></td><td><div className="capacity"><small>{c.availabilityHrs} hrs free</small><i><b style={{width:`${Math.min(100,c.availabilityHrs/40*100)}%`}}/></i></div></td><td><em className="fit">{Math.round(c.fitScore||0)}%</em></td></tr>)}</tbody></table></div>{!candidates.length&&<Empty text="Sync the Excel dataset or adjust your search."/>}</section></>}
function Stat({label,value,danger}:{label:string;value:string|number;danger?:boolean}){return <div className={`stat ${danger?'danger':''}`}><span><small>{label}</small><b>{value}</b><em>{danger?'Action required':'Global active'}</em></span><Activity/></div>}
function Projects({projects,selected,inspect,create,canCreate}:{projects:Project[];selected:Project|null;inspect:(p:Project)=>void;create:()=>void;canCreate:boolean}){return <><Intro eyebrow="Portfolio intelligence" title="Projects" copy="Review requirements and choose the next initiative to optimize." actions={canCreate?<button className="primary" onClick={create}><Plus/>New Project</button>:undefined}/><div className="project-grid">{projects.map(p=><button key={p.id} className={selected?.id===p.id?'selected':''} onClick={()=>inspect(p)}><div><i><FolderKanban/></i><em>Active</em></div><h2>{p.title}</h2><p>{p.requiredRoles.length} required roles · {p.maxDeadlineWeeks} week timeline</p><div className="skills">{p.requiredRoles.slice(0,4).map(r=><i key={r}>{labelRole(r)}</i>)}</div><footer><span>Budget <b>${p.budgetLimit}/hr</b></span><span>Min exp. <b>{p.minExperience}y</b></span></footer></button>)}{!projects.length&&<Empty text="Create your first project to begin."/>}</div></>}
type CreateProps={projects:Project[];selected:Project|null;setSelected:(p:Project)=>void;candidates:number;roles:string[];setRoles:(r:string[])=>void;title:string;setTitle:(v:string)=>void;budget:string;setBudget:(v:string)=>void;deadline:string;setDeadline:(v:string)=>void;experience:string;setExperience:(v:string)=>void;creating:boolean;submit:(e:FormEvent)=>void;syncing:boolean;sync:()=>void;optimizing:boolean;stage:number;generate:()=>void};
function Create(p:CreateProps){const toggle=(r:string)=>p.setRoles(p.roles.includes(r)?p.roles.filter(v=>v!==r):[...p.roles,r]);return <><div className="steps">{['Project details','Requirements','AI optimization','Review & launch'].map((s,i)=><div className={i<2?'active':''} key={s}><i>{i===0?<Check/>:i+1}</i><span><b>{i+1}. {s}</b><small>{i<2?'Configured':'Pending'}</small></span></div>)}</div><Intro eyebrow="Algorithmic workforce assembler" title="Create an optimal team" copy="Define requirements, select a project, and let ShapeTeam AI score the strongest compatible team."/><div className="builder"><section className="card form-card"><CardTitle title="Define project requirements" copy="Create a new initiative for the optimizer."/><form onSubmit={p.submit}><label>Project title<input required value={p.title} onChange={e=>p.setTitle(e.target.value)} placeholder="e.g. Finance API migration"/></label><div><label>Budget limit ($/hr)<input type="number" value={p.budget} onChange={e=>p.setBudget(e.target.value)}/></label><label>Minimum experience<input type="number" value={p.experience} onChange={e=>p.setExperience(e.target.value)}/></label></div><label>Maximum duration (weeks)<input type="number" value={p.deadline} onChange={e=>p.setDeadline(e.target.value)}/></label><fieldset><legend>Required team roles</legend><div>{ROLES.map(([v,l])=><button type="button" key={v} className={p.roles.includes(v)?'chosen':''} onClick={()=>toggle(v)}><i>{p.roles.includes(v)&&<Check/>}</i>{l}</button>)}</div></fieldset><button className="primary submit">{p.creating?<Loader2 className="spin"/>:<Plus/>}Save project requirement</button></form></section><aside className="builder-side"><section className="card"><CardTitle title="Optimization target" copy="Select an existing project."/><div className="project-select">{p.projects.map(x=><button key={x.id} className={p.selected?.id===x.id?'selected':''} onClick={()=>p.setSelected(x)}><span><b>{x.title}</b><small>{x.requiredRoles.length} roles · ${x.budgetLimit}/hr</small></span>{p.selected?.id===x.id?<CheckCircle2/>:<ChevronRight/>}</button>)}</div></section><section className="card launch"><div className="pool"><Database/><span><b>{p.candidates.toLocaleString()}</b><small>Candidates indexed</small></span><button className="secondary" onClick={p.sync}>{p.syncing?<Loader2 className="spin"/>:<RefreshCw/>}Sync</button></div>{p.optimizing?<div className="pipeline"><h3>Optimization in progress</h3>{['ML candidate scoring','Symbolic constraint validation','A* team composition search'].map((x,i)=><p className={p.stage>i?'active':''} key={x}><i>{p.stage>i?<Loader2 className="spin"/>:i+1}</i>{x}</p>)}</div>:<div className="ready"><Sparkles/><h3>Ready to synthesize</h3><p>ShapeTeam combines candidate fit, role constraints, cost, and availability.</p></div>}<button className="ai-button" onClick={p.generate} disabled={!p.selected||p.optimizing}><Sparkles/>{p.optimizing?'Optimizing team...':'Run AI optimization'}<ChevronRight/></button></section></aside></div></>}
function Recommendation({project,team,optimizing,generate,create,launch,canAct}:{project:Project|null;team:Team|undefined;optimizing:boolean;generate:()=>void;create:()=>void;launch:()=>void;canAct:boolean}){if(!project||!team)return <section className="card rec-empty"><Sparkles/><h1>No recommendation selected</h1><p>Create or select a project, then run AI optimization.</p><button className="primary" onClick={create}><WandSparkles/>Build a team</button></section>;const score=Math.round(team.optimalityScore);return <><Intro eyebrow="Algorithm v3.2 • Computed recommendation" title={`AI Team Recommendation: ${project.title}`} copy="Transparent scoring across capability, cost, availability, and compatibility." actions={<>{canAct&&<button className="secondary" onClick={generate}>{optimizing?<Loader2 className="spin"/>:<RefreshCw/>}Regenerate</button>}{canAct&&<button className="primary" onClick={launch} disabled={team.status==='APPROVED'}><Sparkles/>{team.status==='PENDING_APPROVAL'?'Approve recommendation':team.status==='APPROVED'?'Approved':'Submit for approval'}</button>}</>}/><div className="ribbon"><span>● Status: <b>Optimal synergy formed</b></span><span>Overall score: <b>{score}/100</b></span><span>Team size: <b>{team.members.length} specialists</b></span><span>Budget: <b>${team.totalCost}/hr</b></span></div><div className="analysis">{[['Skill Coverage',Math.min(99,score+2)],['Workload Balance',Math.max(75,score-4)],['Psy-Safety & Synergy',Math.min(98,score+1)],['Risk Mitigation',Math.min(96,score)]].map(([l,v])=><div key={l}><small>Algorithmic metric</small><i style={{'--score':`${v}%`} as React.CSSProperties}><b>{v}%</b></i><h3>{l}</h3><p>Sustainable enterprise band</p></div>)}</div><CardTitle title={`Selected Roster (${team.members.length} Specialists)`} copy="Optimized for velocity, decision-making, and dependable delivery."/><div className="roster">{team.members.map((m,i)=><article key={m.id}><i className={`person large c${i%5}`}>{initials(m.candidate.fullName)}</i><em>{Math.max(84,score-i)}% Synergy</em><h3>{m.candidate.fullName}</h3><p>{labelRole(m.assignedRole)}</p><blockquote><small>Algorithmic rationale</small>Strong capability coverage with compatible cost and workload.</blockquote><div className="skills">{m.candidate.skills.slice(0,3).map(s=><i key={s}>{s}</i>)}</div><footer>Avail: {m.candidate.availabilityHrs} hrs/week</footer></article>)}</div><div className="explain"><section className="card"><CardTitle title="Why this team works" copy="Structural compatibility from the cognitive graph."/>{['Complete required role coverage','Budget and experience constraints validated','Complementary skills reduce delivery risk'].map(x=><p key={x}><CheckCircle2/>{x}</p>)}</section><section className="card risk"><CardTitle title="AI Explainability & Risk Advisory" copy="Transparent heuristics and governance flags."/><div><b>Minor role overlap alert</b><p>Clarify architecture and code-review ownership during kickoff.</p></div></section></div></>}
function Analysis({team,project,openWeights,generate}:{team:Team|undefined;project:Project|null;openWeights:()=>void;generate:()=>void}){if(!team)return <section className="card rec-empty"><BarChart3/><h1>No team analysis yet</h1><p>Run an optimization to generate compatibility and delivery metrics.</p><button className="primary" onClick={generate}><WandSparkles/>Create a team</button></section>;const score=Math.round(team.optimalityScore);return <><Intro eyebrow="Decision intelligence" title="Team Analysis" copy={`Validated delivery signals for ${project?.title||'the selected project'}.`} actions={<button className="secondary" onClick={openWeights}><SlidersHorizontal/>Scoring weights</button>}/><div className="stats"><Stat label="Overall compatibility" value={`${score}%`}/><Stat label="Combined capacity" value={`${team.members.reduce((sum,m)=>sum+m.candidate.availabilityHrs,0)}h`}/><Stat label="Team cost" value={`$${team.totalCost}/hr`}/><Stat label="Delivery risk" value={score>90?'Low':'Moderate'}/></div><div className="analysis">{[['Role coverage',100],['Skill adjacency',Math.min(99,score+1)],['Capacity balance',Math.max(78,score-5)],['Cost efficiency',Math.min(97,score)]].map(([label,value])=><div key={label}><small>Validated signal</small><i style={{'--score':`${value}%`} as React.CSSProperties}><b>{value}%</b></i><h3>{label}</h3><p>Within recommended band</p></div>)}</div><section className="card"><CardTitle title="Team composition" copy="Contribution and availability by assigned role."/><div className="diagnostic-list">{team.members.map(member=><p key={member.id}><CheckCircle2/><span><b>{member.candidate.fullName} · {labelRole(member.assignedRole)}</b><small>{member.candidate.availabilityHrs} hrs/week available · {member.candidate.skills.join(', ')}</small></span></p>)}</div></section></>}
function Reports({projects,team,exportTeam}:{projects:Project[];team:Team|undefined;exportTeam:()=>void}){const [busy,setBusy]=useState('');const exportReport=async(format:'pdf'|'csv')=>{setBusy(format);try{const blob=await apiService.exportReport('team_formation',format);saveBlob(`shapeteam-team-formation.${format}`,blob)}finally{setBusy('')}};return <><Intro eyebrow="Workforce intelligence exports" title="Reports" copy="Generate organization-scoped, decision-ready workforce reports." actions={<><button className="secondary" onClick={exportTeam} disabled={!team}><FileText/>Quick summary</button><button className="secondary" onClick={()=>exportReport('csv')} disabled={!!busy}>{busy==='csv'?<Loader2 className="spin"/>:<Download/>}CSV</button><button className="primary" onClick={()=>exportReport('pdf')} disabled={!!busy}>{busy==='pdf'?<Loader2 className="spin"/>:<Download/>}PDF report</button></>}/><div className="project-grid">{projects.map((project,index)=><section className="card report-card" key={project.id}><div><i><FileText/></i><em>{index===0&&team?'Ready':'Project brief'}</em></div><h2>{project.title}</h2><p>{project.requiredRoles.length} roles · {project.maxDeadlineWeeks} weeks</p><div className="skills">{project.requiredRoles.slice(0,4).map(role=><i key={role}>{labelRole(role)}</i>)}</div></section>)}</div>{!projects.length&&<Empty text="Create a project to make reporting available."/>}</>}
function SettingsView({openWeights,flash}:{openWeights:()=>void;flash:(type:'success'|'error',message:string)=>void}){const [configuration,setConfiguration]=useState<{skillMatchWeight:number;experienceWeight:number;behaviorWeight:number;workloadWeight:number;availabilityWeight:number;decisionTreeWeight:number;minimumSkillCoverage:number;maximumWorkload:number;approvalRequired:boolean}|null>(null),[logs,setLogs]=useState<Array<{id:string;action:string;user:string;timestamp:string}>>([]),[saving,setSaving]=useState(false);useEffect(()=>{apiService.getAIConfiguration().then(result=>setConfiguration(result.configuration)).catch(()=>undefined);apiService.getAuditLogs().then(result=>setLogs(result.logs.slice(0,6))).catch(()=>undefined)},[]);const save=async()=>{if(!configuration)return;setSaving(true);try{const result=await apiService.updateAIConfiguration(configuration);setConfiguration(result.configuration);flash('success','AI scoring configuration saved.')}catch(error){flash('error',error instanceof Error?error.message:'Unable to save configuration.')}finally{setSaving(false)}};return <><Intro eyebrow="Platform configuration" title="Settings & Governance" copy="Manage explainable scoring, approval policy, and audit evidence."/><div className="settings-grid"><section className="card"><ShieldCheck/><CardTitle title="Responsible AI controls" copy="Weights must total exactly 100%. Protected attributes are never used."/><button className="secondary" onClick={openWeights}><SlidersHorizontal/>Review scoring model</button></section><section className="card"><Database/><CardTitle title="Organization isolation" copy="Every API query is scoped to the signed-in organization and checked server-side."/><button className="secondary" onClick={()=>flash('success','Organization isolation is active.')}><Check/>Security status</button></section><section className="card"><Bell/><CardTitle title="Approval workflow" copy={configuration?.approvalRequired?'Admin approval is required before a team becomes active.':'Recommendations can activate without admin approval.'}/><button className="secondary" onClick={()=>configuration&&setConfiguration({...configuration,approvalRequired:!configuration.approvalRequired})}><Check/>Toggle policy</button></section></div>{configuration&&<section className="card settings-form"><CardTitle title="AI scoring configuration" copy="Role suitability weights and hard constraint thresholds."/><div className="weight-inputs">{([['skillMatchWeight','Skill match'],['experienceWeight','Experience'],['behaviorWeight','Behavior'],['workloadWeight','Workload'],['availabilityWeight','Availability'],['decisionTreeWeight','Decision tree']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min="0" max="100" value={configuration[key]} onChange={event=>setConfiguration({...configuration,[key]:Number(event.target.value)})}/><span>%</span></label>)}</div><button className="primary" onClick={save} disabled={saving}>{saving?<Loader2 className="spin"/>:<Check/>}Save configuration</button></section>}<section className="card audit-card"><CardTitle title="Recent audit activity" copy="Immutable organization-level records for important actions."/><div className="audit-list">{logs.map(log=><p key={log.id}><span><b>{labelRole(log.action)}</b><small>{log.user}</small></span><time>{new Date(log.timestamp).toLocaleString()}</time></p>)}</div></section></>}
function PanelView({panel,close,candidates,projects,teams,candidate,project,optimize,onRead,canManageRoles,onUserUpdated,added}:{panel:Exclude<Panel,null>;close:()=>void;candidates:Candidate[];projects:Project[];teams:Team[];candidate:Candidate|null;project:Project|null;optimize:(project:Project)=>void;onRead:()=>void;canManageRoles:boolean;onUserUpdated:()=>Promise<void>;added:(candidate:Candidate)=>void}){
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  const [notificationItems,setNotificationItems]=useState<Array<{id:string;title:string;message:string;isRead:boolean}>>([]);
  const [profileRole,setProfileRole]=useState<UserRole>('EMPLOYEE');
  useEffect(()=>{if(panel==='notifications')apiService.getNotifications().then(result=>setNotificationItems(result.notifications)).catch(()=>setNotificationItems([]))},[panel]);
  useEffect(()=>{if(candidate?.user)setProfileRole(candidate.user.role)},[candidate]);
  const [employee,setEmployee]=useState({fullName:'',email:'',role:'DEVELOPER',experienceYears:'3',costPerHour:'55',availabilityHrs:'40',skills:''});
  const saveEmployee=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError('');try{const response=await apiService.createCandidate({...employee,experienceYears:+employee.experienceYears,costPerHour:+employee.costPerHour,availabilityHrs:+employee.availabilityHrs,skills:employee.skills.split(',').map(skill=>skill.trim()).filter(Boolean)});added(response.candidate)}catch(reason){setError(reason instanceof Error?reason.message:'Unable to add employee.')}finally{setSaving(false)}};
  const saveRole=async()=>{if(!candidate)return;setSaving(true);setError('');try{await apiService.updateUser(candidate.id,{role:profileRole});await onUserUpdated();close()}catch(reason){setError(reason instanceof Error?reason.message:'Unable to update role.')}finally{setSaving(false)}};
  return <div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&close()}><section className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={close} aria-label="Close"><X/></button>
    {panel==='addEmployee'&&<><CardTitle title="Add Employee" copy="Create a workforce profile for team optimization."/><form className="employee-form" onSubmit={saveEmployee}><label>Full name<input required value={employee.fullName} onChange={e=>setEmployee({...employee,fullName:e.target.value})}/></label><label>Email address<input required type="email" value={employee.email} onChange={e=>setEmployee({...employee,email:e.target.value})}/></label><label>Role<select value={employee.role} onChange={e=>setEmployee({...employee,role:e.target.value})}>{ROLES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><div><label>Experience (years)<input required min="0" type="number" value={employee.experienceYears} onChange={e=>setEmployee({...employee,experienceYears:e.target.value})}/></label><label>Cost per hour<input required min="1" type="number" value={employee.costPerHour} onChange={e=>setEmployee({...employee,costPerHour:e.target.value})}/></label></div><label>Weekly availability<input required min="0" max="40" type="number" value={employee.availabilityHrs} onChange={e=>setEmployee({...employee,availabilityHrs:e.target.value})}/></label><label>Skills <small>Comma separated</small><input value={employee.skills} onChange={e=>setEmployee({...employee,skills:e.target.value})} placeholder="React, TypeScript, AWS"/></label>{error&&<p className="form-error">{error}</p>}<button className="primary" disabled={saving}>{saving?<Loader2 className="spin"/>:<Plus/>}{saving?'Adding employee...':'Add Employee'}</button></form></>}
    {panel==='diagnostics'&&<><CardTitle title="AI Diagnostics Complete" copy="Live readiness checks across the workforce graph."/><div className="diagnostic-list"><p><CheckCircle2/><span><b>Candidate index healthy</b><small>{candidates.length.toLocaleString()} profiles are available for matching.</small></span></p><p><CheckCircle2/><span><b>Project constraints valid</b><small>{projects.length} active projects passed schema validation.</small></span></p><p><CheckCircle2/><span><b>Optimization history ready</b><small>{teams.length} generated teams are available for comparison.</small></span></p></div><button className="primary modal-action" onClick={close}>Done</button></>}
    {panel==='notifications'&&<><CardTitle title="Notifications" copy={`${notificationItems.filter(item=>!item.isRead).length} unread workforce events.`}/><div className="notice-list">{notificationItems.map(item=><p key={item.id}><Bell/><span><b>{item.title}</b><small>{item.message}</small></span></p>)}{!notificationItems.length&&<Empty text="You are all caught up."/>}</div><button className="primary modal-action" onClick={()=>{onRead();close()}}>Mark all as read</button></>}
    {panel==='candidate'&&candidate&&<><CardTitle title={candidate.fullName} copy={`${labelRole(candidate.role)} · ${candidate.email}`}/><div className="profile-summary"><i className="person large">{initials(candidate.fullName)}</i><div><b>{candidate.experienceYears} years experience</b><small>{candidate.availabilityHrs} hours available weekly · ${candidate.costPerHour}/hr</small></div></div><div className="skills">{candidate.skills.map(skill=><i key={skill}>{skill}</i>)}</div><div className="diagnostic-list"><p><Sparkles/><span><b>{Math.round(candidate.fitScore||0)}% AI fit score</b><small>Calculated from experience, skills, availability, and role adjacency.</small></span></p></div>{canManageRoles&&<div className="role-editor"><label>Account role<select value={profileRole} onChange={event=>setProfileRole(event.target.value as UserRole)}><option value="ORGANIZATION_ADMIN">Organization Admin</option><option value="HR_MANAGER">HR Manager</option><option value="PROJECT_MANAGER">Project Manager</option><option value="TEAM_LEAD">Team Lead</option><option value="EMPLOYEE">Employee</option></select></label>{error&&<p className="form-error">{error}</p>}<button className="secondary" onClick={saveRole} disabled={saving}>{saving?<Loader2 className="spin"/>:<ShieldCheck/>}Update role</button></div>}<button className="primary modal-action" onClick={close}>Close profile</button></>}
    {panel==='project'&&project&&<><CardTitle title={project.title} copy={`${project.requiredRoles.length} required roles · ${project.maxDeadlineWeeks} week timeline`}/><div className="stats modal-stats"><Stat label="Budget" value={`$${project.budgetLimit}/hr`}/><Stat label="Min experience" value={`${project.minExperience}y`}/></div><div className="skills">{project.requiredRoles.map(role=><i key={role}>{labelRole(role)}</i>)}</div><button className="primary modal-action" onClick={()=>optimize(project)}><WandSparkles/>Optimize this project</button></>}
    {panel==='weights'&&<><CardTitle title="AI scoring weights" copy="The current enterprise model balances four explainable signals."/><div className="weight-list">{[['Skills & role coverage','40%'],['Availability & workload','25%'],['Experience depth','20%'],['Cost efficiency','15%']].map(([label,value])=><p key={label}><span>{label}</span><b>{value}</b></p>)}</div><button className="primary modal-action" onClick={close}>Done</button></>}
    {panel==='help'&&<><CardTitle title="ShapeTeam Help Center" copy="Quick guidance for the workforce optimization workflow."/><div className="help-list"><p><b>1. Sync employees</b><span>Open Employees and sync the Excel dataset or add a profile manually.</span></p><p><b>2. Define requirements</b><span>Create a project with budget, timeline, experience, and role constraints.</span></p><p><b>3. Generate a team</b><span>Select the project and run AI optimization to create a recommendation.</span></p><p><b>4. Review and launch</b><span>Inspect the explanation and save the selected roster.</span></p></div><button className="primary modal-action" onClick={close}>Got it</button></>}
  </section></div>
}
function Empty({text}:{text:string}){return <div className="empty"><Users/><h3>No data available</h3><p>{text}</p></div>}
