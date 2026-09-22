import crypto from 'crypto';
import { config } from '../config';
import platformStore from './platformStore';
import { User, UserRole } from '../types/domain';

const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
const sign=(value:string)=>crypto.createHmac('sha256',config.jwtSecret).update(value).digest('base64url');
const hashToken=(token:string)=>crypto.createHash('sha256').update(token).digest('hex');

class AuthService {
  async hashPassword(password:string){const salt=crypto.randomBytes(16).toString('hex');const derived=await new Promise<Buffer>((resolve,reject)=>crypto.scrypt(password,salt,64,(error,key)=>error?reject(error):resolve(key)));return `scrypt$${salt}$${derived.toString('hex')}`}
  async verifyPassword(password:string,stored:string){const [,salt,expected]=stored.split('$');if(!salt||!expected)return false;const derived=await new Promise<Buffer>((resolve,reject)=>crypto.scrypt(password,salt,64,(error,key)=>error?reject(error):resolve(key)));const expectedBuffer=Buffer.from(expected,'hex');return expectedBuffer.length===derived.length&&crypto.timingSafeEqual(expectedBuffer,derived)}
  issueSession(user:User){const now=Math.floor(Date.now()/1000);const body=encode({sub:user.id,org:user.organizationId,role:user.role,iat:now,exp:now+config.sessionHours*3600});const head=encode({alg:'HS256',typ:'JWT'});return `${head}.${body}.${sign(`${head}.${body}`)}`}
  verifySession(token:string){const [head,body,signature]=token.split('.');if(!head||!body||!signature||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(sign(`${head}.${body}`))))throw new Error('Invalid session.');const payload=JSON.parse(Buffer.from(body,'base64url').toString());if(payload.exp<Math.floor(Date.now()/1000))throw new Error('Session expired.');return payload as {sub:string;org:string;role:UserRole;exp:number}}
  createOneTimeToken(userId:string,type:'PASSWORD_RESET'|'EMAIL_VERIFICATION',minutes:number){const raw=crypto.randomBytes(32).toString('base64url');platformStore.mutate(data=>{data.tokens=data.tokens.filter(token=>!(token.userId===userId&&token.type===type&&!token.usedAt));data.tokens.push({id:platformStore.id('token'),userId,tokenHash:hashToken(raw),type,expiresAt:new Date(Date.now()+minutes*60000).toISOString(),usedAt:null})});return raw}
  consumeOneTimeToken(raw:string,type:'PASSWORD_RESET'|'EMAIL_VERIFICATION'){const token=platformStore.read('tokens').find(item=>item.tokenHash===hashToken(raw)&&item.type===type&&!item.usedAt&&new Date(item.expiresAt)>new Date());if(!token)throw new Error('This link is invalid or has expired.');platformStore.mutate(data=>{const match=data.tokens.find(item=>item.id===token.id);if(match)match.usedAt=platformStore.now()});return token}
  validatePassword(password:string){if(password.length<10||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password))throw new Error('Password must be at least 10 characters and include upper-case, lower-case, and a number.')}
  async ensureDemoData(){
    if(platformStore.read('users').length)return;
    const {organization,departments}=platformStore.createOrganization('ShapeTeam Demo','51-200');
    const passwordHash=await this.hashPassword('Demo12345!');
    const now=platformStore.now();
    const profiles:Array<[string,string,UserRole,string,number,number,string[]]>=[
      ['Heyramb Damle','admin@shapeteam.local','ORGANIZATION_ADMIN','Chief People Officer',12,75,['Leadership','Workforce Strategy']],
      ['Maya Patel','hr@shapeteam.local','HR_MANAGER','HR Manager',8,80,['Talent Analytics','People Operations']],
      ['Owen Brooks','pm@shapeteam.local','PROJECT_MANAGER','Program Manager',10,70,['Agile','Architecture']],
      ['Elena Vance','lead@shapeteam.local','TEAM_LEAD','ML Engineer',9,80,['Python','PyTorch','LLMs','Leadership']],
      ['Marcus Chen','employee@shapeteam.local','EMPLOYEE','Backend Engineer',7,75,['Node.js','TypeScript','PostgreSQL','Kubernetes']],
      ['Sarah Jenkins','sarah@shapeteam.local','EMPLOYEE','Product Designer',6,90,['Figma','UX Research','Design Systems']],
      ['Tariq Al-Mansoor','tariq@shapeteam.local','EMPLOYEE','DevOps Engineer',8,70,['AWS','Terraform','Kubernetes','CI/CD']],
      ['Priya Rao','priya@shapeteam.local','EMPLOYEE','Data Analyst',6,85,['SQL','Python','Power BI','dbt']],
      ['Noah Williams','noah@shapeteam.local','EMPLOYEE','Cloud Engineer',8,65,['Azure','Docker','Observability','Terraform']],
      ['Ava Martinez','ava@shapeteam.local','EMPLOYEE','QA Engineer',5,95,['Playwright','Cypress','API Testing']],
      ['Liam O’Connor','liam@shapeteam.local','EMPLOYEE','Frontend Engineer',5,88,['React','TypeScript','Tailwind']],
      ['Iris Walker','iris@shapeteam.local','EMPLOYEE','Product Analyst',7,82,['SQL','Product Analytics','Tableau']],
      ['Nina Kapoor','nina@shapeteam.local','EMPLOYEE','ML Engineer',7,72,['Python','PyTorch','LLMs','MLOps']],
      ['Jon Bell','jon@shapeteam.local','EMPLOYEE','Backend Engineer',6,80,['Node.js','TypeScript','PostgreSQL','API Design']],
      ['Amara Okafor','amara@shapeteam.local','EMPLOYEE','Product Designer',5,84,['Figma','UX Research','Design Systems']],
      ['Kenji Sato','kenji@shapeteam.local','EMPLOYEE','DevOps Engineer',7,76,['AWS','Terraform','CI/CD','Observability']],
      ['Sofia Rossi','sofia@shapeteam.local','EMPLOYEE','QA Engineer',6,86,['Playwright','API Testing','Performance Testing']]
    ];
    platformStore.mutate(data=>{
      for(const [name,email,role,jobTitle,experienceYears,availabilityPercentage,skillNames] of profiles){
        const user:User={id:platformStore.id('usr'),organizationId:organization.id,name,email,passwordHash,role,departmentId:departments[0].id,jobTitle,experienceYears,availabilityPercentage,currentWorkloadPercentage:100-availabilityPercentage,behaviorScore:84+Math.min(12,experienceYears),status:'ACTIVE',profileImage:null,emailVerified:true,createdAt:now,updatedAt:now};
        data.users.push(user);
        for(const skillName of skillNames){
          let skill=data.skills.find(item=>item.organizationId===organization.id&&item.name===skillName);
          if(!skill){skill={id:platformStore.id('skill'),organizationId:organization.id,name:skillName,category:'Professional',description:''};data.skills.push(skill)}
          data.userSkills.push({id:platformStore.id('userskill'),userId:user.id,skillId:skill.id,proficiencyLevel:Math.min(5,Math.max(3,Math.round(experienceYears/2))),yearsOfExperience:Math.min(experienceYears,Math.max(2,experienceYears-2)),verified:true});
        }
      }
      const manager=data.users.find(user=>user.email==='pm@shapeteam.local')!;
      const projectId=platformStore.id('project');
      data.projects.push({id:projectId,organizationId:organization.id,name:'Phoenix Autonomous Agent',description:'Build a production-ready agent platform with secure orchestration and observable delivery.',departmentId:departments[0].id,managerId:manager.id,startDate:new Date().toISOString().slice(0,10),endDate:new Date(Date.now()+16*604800000).toISOString().slice(0,10),priority:'HIGH',requiredTeamSize:5,status:'ACTIVE',completionPercentage:18,createdAt:now,updatedAt:now});
      const requirements=[['ML Engineer',['Python','PyTorch','LLMs'],6],['Backend Engineer',['Node.js','TypeScript','PostgreSQL'],5],['Product Designer',['Figma','UX Research'],4],['DevOps Engineer',['AWS','Terraform','CI/CD'],5],['QA Engineer',['Playwright','API Testing'],4]] as const;
      for(const [roleName,skills,minimumExperience] of requirements)data.requirements.push({id:platformStore.id('requirement'),projectId,roleName,requiredSkills:skills.map(name=>({name,importance:1,required:true,minimumProficiency:3})),requiredSoftSkills:['Communication','Collaboration'],minimumExperience,availabilityRequirement:50,workloadLimit:90,diversityPreferences:{complementaryExperience:true},collaborationStyle:'Collaborative'});
    });
    platformStore.audit({organizationId:organization.id,userId:null,action:'DEMO_ORGANIZATION_CREATED',module:'onboarding',entityType:'Organization',entityId:organization.id,metadata:{seeded:true}});
  }
}
export const authService=new AuthService();
export default authService;
