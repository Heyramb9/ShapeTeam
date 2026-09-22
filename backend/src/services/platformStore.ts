import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AIConfiguration, AuditLog, Department, Organization, PlatformData, User } from '../types/domain';

const DATA_DIR=path.join(__dirname,'../../data');
const DATA_FILE=path.join(DATA_DIR,'platform.json');
const emptyData=():PlatformData=>({organizations:[],departments:[],users:[],skills:[],userSkills:[],projects:[],requirements:[],teams:[],teamMembers:[],recommendations:[],aiConfigurations:[],notifications:[],auditLogs:[],invitations:[],tokens:[],feedback:[]});

class PlatformStore {
  private data:PlatformData=emptyData();
  constructor(){fs.mkdirSync(DATA_DIR,{recursive:true});this.load()}
  id(prefix:string){return `${prefix}_${crypto.randomUUID()}`}
  now(){return new Date().toISOString()}
  snapshot():PlatformData{return structuredClone(this.data)}
  read<K extends keyof PlatformData>(key:K):PlatformData[K]{return this.data[key]}
  mutate<T>(fn:(data:PlatformData)=>T):T{const result=fn(this.data);this.persist();return result}
  private load(){if(!fs.existsSync(DATA_FILE)){this.persist();return}try{const parsed=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));this.data={...emptyData(),...parsed}}catch{this.data=emptyData();this.persist()}}
  private persist(){const temporary=`${DATA_FILE}.tmp`;fs.writeFileSync(temporary,JSON.stringify(this.data,null,2),'utf8');fs.renameSync(temporary,DATA_FILE)}
  sanitizeUser(user:User){const {passwordHash,...safe}=user;return safe}
  organizationData(organizationId:string){const data=this.snapshot();return {organizations:data.organizations.filter(x=>x.id===organizationId),departments:data.departments.filter(x=>x.organizationId===organizationId),users:data.users.filter(x=>x.organizationId===organizationId),skills:data.skills.filter(x=>x.organizationId===null||x.organizationId===organizationId),userSkills:data.userSkills.filter(x=>data.users.some(u=>u.organizationId===organizationId&&u.id===x.userId)),projects:data.projects.filter(x=>x.organizationId===organizationId),requirements:data.requirements.filter(x=>data.projects.some(p=>p.organizationId===organizationId&&p.id===x.projectId)),teams:data.teams.filter(x=>x.organizationId===organizationId),teamMembers:data.teamMembers.filter(x=>data.teams.some(t=>t.organizationId===organizationId&&t.id===x.teamId)),recommendations:data.recommendations.filter(x=>x.organizationId===organizationId),aiConfigurations:data.aiConfigurations.filter(x=>x.organizationId===organizationId),notifications:data.notifications.filter(x=>x.organizationId===organizationId),auditLogs:data.auditLogs.filter(x=>x.organizationId===organizationId),invitations:data.invitations.filter(x=>x.organizationId===organizationId),tokens:data.tokens,feedback:data.feedback.filter(x=>x.organizationId===organizationId)}}
  createOrganization(name:string,size:string,industry='Technology'):{organization:Organization;departments:Department[];configuration:AIConfiguration}{const now=this.now();const organization:Organization={id:this.id('org'),name,industry,size,logo:null,settings:{timezone:'Asia/Calcutta',dateFormat:'DD MMM YYYY'},createdAt:now,updatedAt:now};const departments=['Engineering','Product','Design','Operations','People'].map(name=>({id:this.id('dept'),organizationId:organization.id,name,description:`${name} department`}));const configuration:AIConfiguration={id:this.id('aicfg'),organizationId:organization.id,skillMatchWeight:30,experienceWeight:20,behaviorWeight:15,workloadWeight:15,availabilityWeight:10,decisionTreeWeight:10,minimumSkillCoverage:70,maximumWorkload:90,diversityConstraints:{enabled:true},approvalRequired:true};this.mutate(data=>{data.organizations.push(organization);data.departments.push(...departments);data.aiConfigurations.push(configuration)});return{organization,departments,configuration}}
  audit(entry:Omit<AuditLog,'id'|'timestamp'>){const log:AuditLog={...entry,id:this.id('audit'),timestamp:this.now()};this.mutate(data=>data.auditLogs.unshift(log));return log}
}
export const platformStore=new PlatformStore();
export default platformStore;
