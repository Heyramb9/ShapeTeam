import XLSX from 'xlsx';
import platformStore from './platformStore';
import notificationService from './notificationService';
import { Department, Skill, User, UserSkill } from '../types/domain';

type Row=Record<string,unknown>;
const text=(value:unknown)=>String(value??'').trim();
const number=(value:unknown,fallback=0)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback};
const clamp=(value:number)=>Math.max(0,Math.min(100,value));
const normalized=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'');
const column=(row:Row,...names:string[])=>{const entries=Object.entries(row);for(const name of names){const found=entries.find(([key])=>normalized(key)===normalized(name));if(found)return found[1]}return undefined};

export interface DatasetImportResult { imported:number; replaced:number; departments:number; skills:number; sourceFile:string; warnings:string[] }

class DatasetImportService {
  status(organizationId:string){const organization=platformStore.read('organizations').find(item=>item.id===organizationId);return{required:!organization?.settings.employeeDatasetImportedAt,importedAt:organization?.settings.employeeDatasetImportedAt||null,sourceFile:organization?.settings.employeeDatasetSource||null,employeeCount:Number(organization?.settings.employeeDatasetCount||0)}}

  import(organizationId:string,actorId:string,fileName:string,base64:string):DatasetImportResult{
    if(!/\.(xlsx|xls|csv)$/i.test(fileName))throw new Error('Upload an Excel (.xlsx or .xls) or CSV employee dataset.');
    const buffer=Buffer.from(base64,'base64');
    if(!buffer.length)throw new Error('The selected dataset is empty.');
    if(buffer.length>20*1024*1024)throw new Error('The dataset exceeds the 20 MB upload limit.');
    const workbook=XLSX.read(buffer,{type:'buffer',cellDates:true});
    const firstSheet=workbook.SheetNames[0];
    if(!firstSheet)throw new Error('The workbook does not contain a worksheet.');
    const rows=XLSX.utils.sheet_to_json<Row>(workbook.Sheets[firstSheet],{defval:null,raw:true});
    if(!rows.length)throw new Error('The employee worksheet has no data rows.');
    if(rows.length>100000)throw new Error('A maximum of 100,000 employee rows can be imported at once.');
    const headers=Object.keys(rows[0]).map(normalized);
    const missing=[['Employee_ID','employeeid'],['Employee_Name','employeename'],['Department','department'],['Experience_Years','experienceyears'],['Current_Workload_%','currentworkload']].filter(([,key])=>!headers.includes(key)).map(([label])=>label);
    if(missing.length)throw new Error(`Missing required columns: ${missing.join(', ')}.`);

    const uniqueRows=new Map<string,Row>();
    for(const row of rows){const externalId=text(column(row,'Employee_ID','Employee ID'));if(externalId&&!uniqueRows.has(externalId))uniqueRows.set(externalId,row)}
    if(!uniqueRows.size)throw new Error('No valid employee identifiers were found.');
    const warnings:string[]=[];
    if(uniqueRows.size<rows.length)warnings.push(`${rows.length-uniqueRows.size} duplicate employee rows were skipped.`);
    const now=platformStore.now();
    let replaced=0,departmentCount=0,skillCount=0;

    platformStore.mutate(data=>{
      const removable=new Set(data.users.filter(user=>user.organizationId===organizationId&&(user.dataSource==='DATASET'||user.dataSource==='DEMO'||(user.role==='EMPLOYEE'&&user.email.endsWith('@shapeteam.local')))).map(user=>user.id));
      replaced=removable.size;
      data.userSkills=data.userSkills.filter(link=>!removable.has(link.userId));
      data.users=data.users.filter(user=>!removable.has(user.id));
      const departments=new Map<string,Department>(data.departments.filter(item=>item.organizationId===organizationId).map(item=>[item.name.toLowerCase(),item]));
      const skills=new Map<string,Skill>(data.skills.filter(item=>item.organizationId===organizationId||item.organizationId===null).map(item=>[item.name.toLowerCase(),item]));
      const newUsers:User[]=[];const newLinks:UserSkill[]=[];
      for(const [externalId,row] of uniqueRows){
        const departmentName=text(column(row,'Department'))||'Unassigned';
        let department=departments.get(departmentName.toLowerCase());
        if(!department){department={id:platformStore.id('dept'),organizationId,name:departmentName,description:`Imported from ${fileName}`};departments.set(departmentName.toLowerCase(),department);data.departments.push(department);departmentCount++}
        const experience=Math.max(0,number(column(row,'Experience_Years','Experience Years')));
        const workload=clamp(number(column(row,'Current_Workload_%','Current Workload %')));
        const availabilityText=text(column(row,'Availability')).toLowerCase();
        const availability=availabilityText.includes('unavailable')?0:availabilityText.includes('partial')?Math.max(25,100-workload):availabilityText.includes('available')?Math.max(75,100-workload):clamp(100-workload);
        const behaviorMatch=number(column(row,'Behavior_Match_%','Behavior Match %'),NaN);
        const behaviorInputs=['Communication_Score','Leadership_Score','Teamwork_Score','Problem_Solving'].map(name=>number(column(row,name),NaN)).filter(Number.isFinite);
        const behavior=clamp(Number.isFinite(behaviorMatch)?behaviorMatch:(behaviorInputs.length?behaviorInputs.reduce((a,b)=>a+b,0)/behaviorInputs.length*10:number(column(row,'Performance_Rating'),4)*20));
        const preferredRole=text(column(row,'Preferred_Role','Preferred Role'))||text(column(row,'DecisionTree_Role','Decision Tree Role'))||'Employee';
        const user:User={id:platformStore.id('usr'),organizationId,name:text(column(row,'Employee_Name','Employee Name'))||externalId,email:`${normalized(externalId)}.${organizationId.slice(-8)}@dataset.shapeteam.local`,passwordHash:'dataset$disabled',role:'EMPLOYEE',departmentId:department.id,jobTitle:preferredRole,experienceYears:experience,availabilityPercentage:availability,currentWorkloadPercentage:workload,behaviorScore:behavior,status:'ACTIVE',profileImage:null,emailVerified:false,externalId,dataSource:'DATASET',metadata:{behaviorProfile:text(column(row,'Behavior_Profile')),communicationScore:number(column(row,'Communication_Score')),leadershipScore:number(column(row,'Leadership_Score')),teamworkScore:number(column(row,'Teamwork_Score')),problemSolving:number(column(row,'Problem_Solving')),performanceRating:number(column(row,'Performance_Rating')),certificationCount:number(column(row,'Certification_Count')),pastProjects:number(column(row,'Past_Projects')),projectDomain:text(column(row,'Project_Domain')),location:text(column(row,'Location')),employmentType:text(column(row,'Employment_Type')),projectId:text(column(row,'Project_ID')),requiredRole:text(column(row,'Required_Role')),skillMatch:number(column(row,'Skill_Match_%')),behaviorMatch:number(column(row,'Behavior_Match_%')),datasetRoleSuitabilityScore:number(column(row,'Role_Suitability_Score')),predictedCluster:text(column(row,'Predicted_Cluster')),decisionTreeRole:text(column(row,'DecisionTree_Role')),assigned:text(column(row,'Assigned'))},createdAt:now,updatedAt:now};
        newUsers.push(user);
        const skillMatch=clamp(number(column(row,'Skill_Match_%'),60));
        const skillNames=[text(column(row,'Primary_Skill','Primary Skill')),text(column(row,'Secondary_Skill','Secondary Skill'))].filter(Boolean);
        for(let index=0;index<skillNames.length;index++){const name=skillNames[index];let skill=skills.get(name.toLowerCase());if(!skill){skill={id:platformStore.id('skill'),organizationId,name,category:'Professional',description:`Imported from ${fileName}`};skills.set(name.toLowerCase(),skill);data.skills.push(skill);skillCount++}newLinks.push({id:platformStore.id('userskill'),userId:user.id,skillId:skill.id,proficiencyLevel:Math.max(1,Math.min(5,Math.round(skillMatch/20))),yearsOfExperience:index===0?experience:Math.round(experience/2),verified:false})}
      }
      data.users.push(...newUsers);data.userSkills.push(...newLinks);
      const organization=data.organizations.find(item=>item.id===organizationId);if(organization){organization.settings={...organization.settings,employeeDatasetImportedAt:now,employeeDatasetSource:fileName,employeeDatasetCount:newUsers.length,employeeDatasetSheet:firstSheet};organization.updatedAt=now}
    });
    platformStore.audit({organizationId,userId:actorId,action:'EMPLOYEE_DATASET_IMPORTED',module:'onboarding',entityType:'Organization',entityId:organizationId,metadata:{fileName,rows:uniqueRows.size,replaced,warnings}});
    notificationService.create(organizationId,actorId,'DATASET_IMPORT','Employee dataset imported',`${uniqueRows.size.toLocaleString()} workforce profiles are ready for analysis.`);
    return{imported:uniqueRows.size,replaced,departments:departmentCount,skills:skillCount,sourceFile:fileName,warnings};
  }
}
export const datasetImportService=new DatasetImportService();
export default datasetImportService;
