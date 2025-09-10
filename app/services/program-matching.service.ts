import { Prisma, QualificationType, RequirementType } from "@prisma/client";
import prisma from '@/lib/prisma';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: string;
  student?: {
    id: string;
  };
}

export interface ProgramMatch {
  programId: string;
  programName: string;
  departmentName: string;
  universityName: string;
  matchScore: number;
  metRequirements: number;
  totalRequirements: number;
  requirements: RequirementMatch[];
}

export interface RequirementMatch {
  requirementId: string;
  type: RequirementType;
  subject?: string;
  minGrade?: string;
  description: string;
  status: 'met' | 'partial' | 'not-met';
  matchingQualifications: QualificationMatch[];
}

export interface QualificationMatch {
  qualificationId: string;
  type: QualificationType;
  subject: string;
  grade: string;
  verified: boolean;
  matchReason: string;
}

/**
 * Check if a student's qualifications match program requirements
 * Returns both perfect matches (100%) and partial matches (50-99%) as recommendations
 */
export async function getProgramMatches(
  currentUser: UserSession
): Promise<ProgramMatch[]> {
  try {
    // Resolve student ID
    let studentId = currentUser.student?.id;
    if (!studentId) {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.id }
      });
      if (!student) {
        console.error("No student record found for user:", currentUser.id);
        return [];
      }
      studentId = student.id;
    }

    // Get all programs with their requirements
    const programs = await prisma.program.findMany({
      include: {
        department: {
          include: {
            university: true
          }
        },
        requirements: true
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });

    // Get student's verified qualifications
    const qualifications = await prisma.qualification.findMany({
      where: {
        studentId: studentId,
        verified: true 
      }
    });

    const matches: ProgramMatch[] = [];

    for (const program of programs) {
      // Skip programs with no requirements
      if (!program.requirements || program.requirements.length === 0) {
        continue;
      }

      const requirementMatches: RequirementMatch[] = [];
      let metRequirements = 0;

      // Check each requirement against student's qualifications
      for (const requirement of program.requirements) {
        const matchResult = checkSingleRequirement(requirement, qualifications);
        
        requirementMatches.push({
          requirementId: requirement.id,
          type: requirement.type,
          subject: requirement.subject || undefined,
          minGrade: requirement.minGrade || undefined,
          description: requirement.description,
          status: matchResult.status,
          matchingQualifications: matchResult.matchingQualifications
        });

        if (matchResult.status === 'met') {
          metRequirements++;
        }
      }

      const totalRequirements = program.requirements.length;
      const matchScore = Math.round((metRequirements / totalRequirements) * 100);

      // Add programs with at least 50% match score (both perfect and partial matches)
      if (matchScore >= 50) {
        matches.push({
          programId: program.id,
          programName: program.name,
          departmentName: program.department?.name || 'Unknown Department',
          universityName: program.department?.university?.name || 'Unknown University',
          matchScore,
          metRequirements,
          totalRequirements,
          requirements: requirementMatches
        });
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
    
  } catch (error) {
    console.error("Error in getProgramMatches:", error);
    return [];
  }
}

// The rest of the helper functions remain unchanged...

/**
 * Check a single requirement against all qualifications
 */
function checkSingleRequirement(
  requirement: any,
  qualifications: any[]
): { status: 'met' | 'partial' | 'not-met'; matchingQualifications: QualificationMatch[] } {
  
  const matchingQualifications: QualificationMatch[] = [];
  
  for (const qualification of qualifications) {
    const match = checkQualificationAgainstRequirement(qualification, requirement);
    if (match.matches) {
      matchingQualifications.push({
        qualificationId: qualification.id,
        type: qualification.type,
        subject: qualification.subject,
        grade: qualification.grade,
        verified: qualification.verified,
        matchReason: match.reason
      });
    }
  }

  // Determine status based on requirement type and matches
  let status: 'met' | 'partial' | 'not-met' = 'not-met';
  
  if (matchingQualifications.length > 0) {
    status = 'met';
  } else {
    // Check for partial matches based on requirement type
    status = checkPartialMatch(requirement, qualifications);
  }

  return { status, matchingQualifications };
}

/**
 * Check if a single qualification matches a single requirement
 */
function checkQualificationAgainstRequirement(
  qualification: any,
  requirement: any
): { matches: boolean; reason: string } {
  
  // 1. Check if qualification type is appropriate for requirement type
  if (!isQualificationTypeCompatible(qualification.type, requirement.type)) {
    return { matches: false, reason: 'Qualification type not compatible with requirement type' };
  }

  // 2. For GRADE requirements, check subject and grade
  if (requirement.type === 'GRADE') {
    // Check subject match
    if (requirement.subject && qualification.subject !== requirement.subject) {
      return { matches: false, reason: `Subject mismatch: ${qualification.subject} vs ${requirement.subject}` };
    }
    
    // Check grade requirement
    if (requirement.minGrade) {
      const gradeMatch = compareGrades(qualification.grade, requirement.minGrade);
      if (!gradeMatch.matches) {
        return { matches: false, reason: `Grade too low: ${qualification.grade} < ${requirement.minGrade}` };
      }
    }
    
    return { matches: true, reason: 'Meets grade requirement' };
  }

  // 3. For LANGUAGE requirements
  if (requirement.type === 'LANGUAGE') {
    // Language tests are verified by having the appropriate qualification type
    // Additional checks could be added for minimum scores if stored in minGrade field
    if (requirement.minGrade) {
      const scoreMatch = compareLanguageScores(qualification.grade, requirement.minGrade);
      if (!scoreMatch.matches) {
        return { matches: false, reason: `Language score too low: ${qualification.grade} < ${requirement.minGrade}` };
      }
    }
    
    return { matches: true, reason: 'Meets language requirement' };
  }

  // 4. For other requirement types (COURSE, INTERVIEW, PORTFOLIO)
  // These typically require manual verification or different logic
  return { matches: false, reason: `Requirement type ${requirement.type} requires manual verification` };
}

/**
 * Check if qualification type is compatible with requirement type
 */
function isQualificationTypeCompatible(
  qualificationType: QualificationType,
  requirementType: RequirementType
): boolean {
  const compatibilityMatrix: Record<RequirementType, QualificationType[]> = {
    GRADE: ['HIGH_SCHOOL', 'UNDERGRADUATE', 'OTHER'],
    LANGUAGE: ['LANGUAGE_TEST'],
    COURSE: ['UNDERGRADUATE', 'OTHER'],
    INTERVIEW: [], // Typically not satisfied by qualifications
    PORTFOLIO: []  // Typically not satisfied by qualifications
  };

  return compatibilityMatrix[requirementType].includes(qualificationType);
}

/**
 * Compare grades for GRADE requirements
 */
function compareGrades(
  studentGrade: string,
  requiredGrade: string
): { matches: boolean; reason: string } {
  
  // Handle letter grades (A, B, C, etc.)
  const gradeOrder = ['F9', 'E8', 'D7', 'C6', 'C5', 'C4', 'B3', 'B2', 'A1'];
  const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
  const requiredIndex = gradeOrder.indexOf(requiredGrade.toUpperCase());

  if (studentIndex !== -1 && requiredIndex !== -1) {
    return {
      matches: studentIndex >= requiredIndex,
      reason: studentIndex >= requiredIndex ? 'Meets grade requirement' : 'Below required grade'
    };
  }

  // Handle numeric grades (percentages, GPA, etc.)
  try {
    const studentNum = parseFloat(studentGrade);
    const requiredNum = parseFloat(requiredGrade);
    
    if (!isNaN(studentNum) && !isNaN(requiredNum)) {
      return {
        matches: studentNum >= requiredNum,
        reason: studentNum >= requiredNum ? 'Meets grade requirement' : 'Below required grade'
      };
    }
  } catch {
    // If parsing fails, be conservative and assume no match
    return { matches: false, reason: 'Cannot compare grades - invalid format' };
  }

  return { matches: false, reason: 'Cannot compare grades - unknown format' };
}

/**
 * Compare language scores for LANGUAGE requirements
 */
function compareLanguageScores(
  studentScore: string,
  requiredScore: string
): { matches: boolean; reason: string } {
  
  // Handle common language test formats (IELTS: 6.5, TOEFL: 90, etc.)
  try {
    const studentNum = parseFloat(studentScore);
    const requiredNum = parseFloat(requiredScore);
    
    if (!isNaN(studentNum) && !isNaN(requiredNum)) {
      return {
        matches: studentNum >= requiredNum,
        reason: studentNum >= requiredNum ? 'Meets language requirement' : 'Below required score'
      };
    }
  } catch {
    // If parsing fails, try to handle band scores (e.g., IELTS 6.5 vs 7.0)
    return { matches: false, reason: 'Cannot compare language scores - invalid format' };
  }

  return { matches: false, reason: 'Cannot compare language scores - unknown format' };
}

/**
 * Check for partial matches
 */
function checkPartialMatch(requirement: any, qualifications: any[]): 'partial' | 'not-met' {
  
  // Partial match for LANGUAGE requirements if student has any language qualification
  if (requirement.type === 'LANGUAGE') {
    const hasAnyLanguageQual = qualifications.some(q => q.type === 'LANGUAGE_TEST');
    return hasAnyLanguageQual ? 'partial' : 'not-met';
  }

  // Partial match for GRADE requirements if student has the subject but lower grade
  if (requirement.type === 'GRADE' && requirement.subject) {
    const hasSubjectWithLowerGrade = qualifications.some(q => 
      q.type !== 'LANGUAGE_TEST' && // Exclude language tests
      q.subject === requirement.subject
    );
    return hasSubjectWithLowerGrade ? 'partial' : 'not-met';
  }

  return 'not-met';
}