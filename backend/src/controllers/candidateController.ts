import { Request, Response } from 'express';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import dbService from '../services/db';

const DATASET_PATH = path.join(__dirname, '../../../ShapeTeam_Dataset.xlsx');

// Helper to map Excel role string to Prisma Role enum
export const mapExcelRoleToEnum = (roleStr: string): string => {
  if (!roleStr) return 'DEVELOPER';
  const normalized = roleStr.trim().toUpperCase().replace(/\s+/g, '_');
  
  if (normalized === 'UI_DESIGNER') return 'DESIGNER';
  if (normalized === 'DEVOPS_ENGINEER') return 'DEVOPS';
  
  // Make sure it matches one of the enum values
  const enumRoles = [
    'DEVELOPER', 'DESIGNER', 'PROJECT_MANAGER', 'DATA_SCIENTIST', 'DEVOPS',
    'DATA_ANALYST', 'TEAM_LEAD', 'PRODUCT_ANALYST', 'ML_ENGINEER',
    'CLOUD_ENGINEER', 'QA_ENGINEER', 'TESTER'
  ];
  
  if (enumRoles.includes(normalized)) {
    return normalized;
  }
  
  // Fallbacks for any other roles
  if (normalized.includes('DEVELOPER')) return 'DEVELOPER';
  if (normalized.includes('LEAD') || normalized.includes('MANAGER')) return 'TEAM_LEAD';
  if (normalized.includes('ANALYST')) return 'DATA_ANALYST';
  if (normalized.includes('TEST')) return 'TESTER';
  
  return 'DEVELOPER';
};

// Helper to calculate costPerHour based on role and experience
export const calculateCostPerHour = (role: string, expYears: number): number => {
  let baseCost = 30; // Default base cost
  
  switch (role) {
    case 'ML_ENGINEER': baseCost = 65; break;
    case 'TEAM_LEAD': baseCost = 60; break;
    case 'DEVOPS': baseCost = 55; break;
    case 'CLOUD_ENGINEER': baseCost = 55; break;
    case 'DEVELOPER': baseCost = 50; break;
    case 'PRODUCT_ANALYST': baseCost = 50; break;
    case 'DESIGNER': baseCost = 45; break;
    case 'DATA_ANALYST': baseCost = 45; break;
    case 'QA_ENGINEER': baseCost = 40; break;
    case 'TESTER': baseCost = 35; break;
    case 'DATA_SCIENTIST': baseCost = 60; break;
    case 'PROJECT_MANAGER': baseCost = 60; break;
  }
  
  // Add $2 per year of experience
  const expFactor = expYears * 2;
  return baseCost + expFactor;
};

// Helper to parse availability to hours
export const parseAvailabilityToHours = (availStr: string): number => {
  if (!availStr) return 40;
  const val = availStr.trim().toLowerCase();
  if (val.includes('partially') || val.includes('part')) return 20;
  if (val.includes('busy')) return 10;
  return 40; // Default: 'Available'
};

export const syncCandidates = async (req: Request, res: Response) => {
  try {
    console.log(`Sync request started. Checking Excel dataset at: ${DATASET_PATH}`);
    
    if (!fs.existsSync(DATASET_PATH)) {
      return res.status(404).json({
        success: false,
        message: `Dataset file not found at expected path: ${DATASET_PATH}`
      });
    }

    // Read Excel file
    const workbook = xlsx.readFile(DATASET_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

    console.log(`Parsed ${rawData.length} rows from Excel file. Transforming data...`);

    // Transform raw Excel data to Database schema format
    const candidates = rawData.map((row: any) => {
      const expYears = Number(row.Experience_Years) || 0;
      const roleEnum = mapExcelRoleToEnum(row.Preferred_Role || row.DecisionTree_Role || row.Required_Role);
      const cost = calculateCostPerHour(roleEnum, expYears);
      const availHrs = parseAvailabilityToHours(row.Availability);
      
      // Combine skills
      const skills: string[] = [];
      if (row.Primary_Skill) skills.push(row.Primary_Skill.trim());
      if (row.Secondary_Skill) skills.push(row.Secondary_Skill.trim());
      
      // Parse predicted cluster (e.g., "Cluster 2" -> 2)
      let clusterId: number | null = null;
      if (row.Predicted_Cluster) {
        const clusterMatch = String(row.Predicted_Cluster).match(/\d+/);
        if (clusterMatch) {
          clusterId = parseInt(clusterMatch[0], 10);
        }
      }

      return {
        id: row.Employee_ID || Math.random().toString(36).substr(2, 9),
        fullName: row.Employee_Name || `Employee_${row.Employee_ID}`,
        email: row.Employee_ID ? `${row.Employee_ID.toLowerCase()}@shapeteam.com` : `c_${Math.random().toString(36).substr(2, 5)}@shapeteam.com`,
        role: roleEnum,
        experienceYears: expYears,
        costPerHour: cost,
        availabilityHrs: availHrs,
        skills,
        clusterId,
        fitScore: row.Role_Suitability_Score !== undefined ? Number(row.Role_Suitability_Score) : null,
      };
    });

    console.log(`Database transformation complete. Syncing to database...`);
    const count = await dbService.syncCandidates(candidates);

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${count} candidates from Excel sheet.`,
      count
    });
  } catch (error: any) {
    console.error('Error syncing candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync candidates.',
      error: error.message
    });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await dbService.getAllCandidates();
    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates
    });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidates.',
      error: error.message
    });
  }
};
