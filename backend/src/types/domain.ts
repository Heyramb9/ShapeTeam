export type UserRole = 'ORGANIZATION_ADMIN' | 'HR_MANAGER' | 'PROJECT_MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type WorkflowStatus = 'DRAFT' | 'PROCESSING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'CHANGES_REQUESTED';

export interface Organization { id:string; name:string; industry:string; size:string; logo:string|null; settings:Record<string,unknown>; createdAt:string; updatedAt:string }
export interface Department { id:string; organizationId:string; name:string; description:string }
export interface User { id:string; organizationId:string; name:string; email:string; passwordHash:string; role:UserRole; departmentId:string|null; jobTitle:string; experienceYears:number; availabilityPercentage:number; currentWorkloadPercentage:number; behaviorScore:number; status:UserStatus; profileImage:string|null; emailVerified:boolean; externalId?:string; dataSource?:'DATASET'|'DEMO'|'MANUAL'; metadata?:Record<string,unknown>; createdAt:string; updatedAt:string }
export interface Skill { id:string; organizationId:string|null; name:string; category:string; description:string }
export interface UserSkill { id:string; userId:string; skillId:string; proficiencyLevel:number; yearsOfExperience:number; verified:boolean }
export interface Project { id:string; organizationId:string; name:string; description:string; departmentId:string|null; managerId:string; startDate:string; endDate:string; priority:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; requiredTeamSize:number; status:'DRAFT'|'ACTIVE'|'COMPLETED'|'ARCHIVED'; completionPercentage:number; createdAt:string; updatedAt:string }
export interface ProjectRequirement { id:string; projectId:string; roleName:string; requiredSkills:Array<{name:string;importance:number;required:boolean;minimumProficiency:number}>; requiredSoftSkills:string[]; minimumExperience:number; availabilityRequirement:number; workloadLimit:number; diversityPreferences:Record<string,unknown>; collaborationStyle:string }
export interface Team { id:string; organizationId:string; projectId:string; name:string; status:WorkflowStatus; compatibilityScore:number; skillCoverageScore:number; workloadBalanceScore:number; availabilityScore:number; diversityScore:number; confidenceScore:number; createdBy:string; approvedBy:string|null; approvedAt:string|null; createdAt:string }
export interface TeamMember { id:string; teamId:string; userId:string; assignedRole:string; roleSuitabilityScore:number; assignmentReason:string; workloadAtAssignment:number; scoreBreakdown:ScoreBreakdown }
export interface Recommendation { id:string; organizationId:string; projectId:string; teamId:string; recommendationScore:number; confidenceScore:number; strengths:string[]; risks:string[]; missingSkills:string[]; explanation:string; suggestedAction:string; status:WorkflowStatus; generatedAt:string; reviewedAt:string|null; reviewNote:string|null }
export interface AIConfiguration { id:string; organizationId:string; skillMatchWeight:number; experienceWeight:number; behaviorWeight:number; workloadWeight:number; availabilityWeight:number; decisionTreeWeight:number; minimumSkillCoverage:number; maximumWorkload:number; diversityConstraints:Record<string,unknown>; approvalRequired:boolean }
export interface Notification { id:string; organizationId:string; userId:string; type:string; title:string; message:string; isRead:boolean; createdAt:string }
export interface AuditLog { id:string; organizationId:string; userId:string|null; action:string; module:string; entityType:string; entityId:string|null; metadata:Record<string,unknown>; timestamp:string }
export interface Invitation { id:string; organizationId:string; email:string; role:UserRole; tokenHash:string; expiresAt:string; acceptedAt:string|null; invitedBy:string }
export interface OneTimeToken { id:string; userId:string; tokenHash:string; type:'PASSWORD_RESET'|'EMAIL_VERIFICATION'; expiresAt:string; usedAt:string|null }
export interface Feedback { id:string; organizationId:string; teamId:string; userId:string; teamworkRating:number; communicationRating:number; leadershipRating:number; collaborationRating:number; comments:string; createdAt:string }

export interface ScoreBreakdown { skillMatch:number; experienceScore:number; behaviorScore:number; workloadScore:number; availabilityScore:number; decisionTreeConfidence:number; roleSuitability:number; usedFallback:boolean }
export interface PlatformData { organizations:Organization[]; departments:Department[]; users:User[]; skills:Skill[]; userSkills:UserSkill[]; projects:Project[]; requirements:ProjectRequirement[]; teams:Team[]; teamMembers:TeamMember[]; recommendations:Recommendation[]; aiConfigurations:AIConfiguration[]; notifications:Notification[]; auditLogs:AuditLog[]; invitations:Invitation[]; tokens:OneTimeToken[]; feedback:Feedback[] }

export const ROLE_PERMISSIONS: Record<UserRole,string[]> = {
  ORGANIZATION_ADMIN:['organization:manage','users:manage','roles:manage','departments:manage','projects:read','projects:write','teams:read','teams:write','recommendations:generate','recommendations:review','reports:read','audit:read','ai:manage','notifications:read'],
  HR_MANAGER:['users:read','employees:manage','projects:read','teams:read','teams:write','recommendations:generate','reports:read','notifications:read'],
  PROJECT_MANAGER:['users:read','projects:read','projects:write','teams:read','recommendations:generate','recommendations:submit','reports:read','notifications:read'],
  TEAM_LEAD:['projects:read:assigned','teams:read:assigned','analytics:read:assigned','feedback:write','workload:read:assigned','notifications:read'],
  EMPLOYEE:['profile:read:self','profile:write:self','projects:read:assigned','teams:read:assigned','workload:read:self','feedback:write','notifications:read']
};
