import prisma from "@/lib/prisma";
import { ApplicationStatus, QualificationType } from "@prisma/client";
import { RequirementType } from "@prisma/client";

export interface StudentAnalyticsData {
  totalMatches: number;
  matchesThisWeek: number;
  totalApplications: number;
  pendingApplications: number;
  draftApplications: number;
  totalQualifications: number;
  verifiedQualifications: number;
  recentMatches: RecentMatch[];
  upcomingDeadlines: UpcomingDeadline[];
  recommendedCourses: RecommendedCourse[];
  recentActivity: RecentActivity[];
  qualificationStats: QualificationStats;
  applications: Application[];
}

interface RecentMatch {
  id: string;
  programName: string;
  university: string;
  matchScore: number;
  timeAgo: string;
}

interface UpcomingDeadline {
  id: string;
  programName: string;
  university: string;
  deadline: Date;
  daysLeft: number;
}

interface RecommendedCourse {
  id: string;
  name: string;
  provider: string;
  relevance: string;
}

interface RecentActivity {
  type: 'application' | 'qualification';
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: string;
}

interface QualificationStats {
  total: number;
  verified: number;
  highSchool: number;
  undergraduate: number;
}

interface Application {
  id: string;
  program: {
    name: string;
    department: {
      university: {
        name: string;
      };
    };
  };
  status: ApplicationStatus;
  createdAt: Date;
}

export interface Qualification {
  id: string;
  studentId: string;
  type: QualificationType;
  subject: string;
  grade: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramRequirement {
  id: string;
  programId: string;
  type: RequirementType; 
  subject?: string | null;
  minGrade?: string | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckProgramRequirementsParams {
  qualifications: Qualification[];
  requirements: ProgramRequirement[];
}

export type CheckProgramRequirementsFunction = (
  params: CheckProgramRequirementsParams
) => boolean;


/**
 * Applicant or Student analytics
 */

export async function fetchStudentAnalyticsData(userId: string) {
  try {
    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        qualifications: true,
        applications: {
          include: {
            program: {
              include: {
                department: {
                  include: {
                    university: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const programMatches = await getProgramMatchesCount(userId);
    

    // Count applications by status
    const applicationStatusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: {
        studentId: student.id
      },
      _count: {
        id: true
      }
    });

    // Get qualification stats
    const qualificationStats = {
      total: student.qualifications.length,
      verified: student.qualifications.filter(q => q.verified).length,
      highSchool: student.qualifications.filter(q => q.type === QualificationType.HIGH_SCHOOL).length,
      undergraduate: student.qualifications.filter(q => q.type === QualificationType.UNDERGRADUATE).length,
    };

    // Get recent activity (applications and qualifications)
    const recentActivity = await getRecentActivity(student.id);

    return {
      // Summary stats
      totalMatches: programMatches.total,
      matchesThisWeek: programMatches.thisWeek,
      totalApplications: student.applications.length,
      pendingApplications: applicationStatusCounts.find(a => a.status === ApplicationStatus.PENDING)?._count.id || 0,
      draftApplications: applicationStatusCounts.find(a => a.status === ApplicationStatus.DRAFT)?._count.id || 0,
      totalQualifications: qualificationStats.total,
      verifiedQualifications: qualificationStats.verified,

      // Detailed data
     
      recentActivity,
      qualificationStats,
      applications: student.applications.slice(0, 5), 
    };
  } catch (error) {
    console.error("Student analytics fetch error:", error);
    return getDefaultStudentAnalytics();
  }
}

async function getProgramMatchesCount(userId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        qualifications: true,
        applications: {
          select: { programId: true }
        }
      }
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Get all programs with their requirements
    const allPrograms = await prisma.program.findMany({
      include: {
        requirements: true,
        department: {
          include: {
            university: true
          }
        }
      }
    });

    // Calculate matches
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    let totalMatches = 0;
    let weeklyMatches = 0;

    for (const program of allPrograms) {
      // Skip programs the student has already applied to
      if (student.applications.some(app => app.programId === program.id)) {
        continue;
      }

      // Check if student meets program requirements
      const isMatch = checkProgramRequirements(student.qualifications, program.requirements);
      
      if (isMatch) {
        totalMatches++;
        
        // Check if this match would have occurred in the current week
        // (For simplicity, we'll assume programs are evaluated when created)
        const programCreated = new Date(program.createdAt);
        if (programCreated >= currentWeekStart) {
          weeklyMatches++;
        }
      }
    }

    return { total: totalMatches, thisWeek: weeklyMatches };
  } catch (error) {
    console.error("Error calculating program matches:", error);
    return { total: 0, thisWeek: 0 };
  }
}

function checkProgramRequirements(
  qualifications: Qualification[], 
  requirements: ProgramRequirement[]
): boolean {
  // Group requirements by type for easier processing
  const requirementGroups: Record<string, ProgramRequirement[]> = {};
  
  requirements.forEach(req => {
    if (!requirementGroups[req.type]) {
      requirementGroups[req.type] = [];
    }
    requirementGroups[req.type].push(req);
  });
  
  // Check each requirement type
  for (const [type, reqs] of Object.entries(requirementGroups)) {
    let requirementMet = false;
    
    switch (type) {
      case "GRADE":
        // Check if student has required grades in required subjects
        requirementMet = reqs.every(req => {
          const qual = qualifications.find(q => 
            q.type === "HIGH_SCHOOL" && 
            q.subject.toLowerCase() === req.subject?.toLowerCase()
          );
          
          return qual && compareGrades(qual.grade, req.minGrade || "");
        });
        break;
        
      case "COURSE":
        // Check if student has taken required courses
        requirementMet = reqs.every(req => {
          return qualifications.some(q => 
            q.type === "UNDERGRADUATE" && 
            q.subject.toLowerCase() === req.subject?.toLowerCase() &&
            compareGrades(q.grade, req.minGrade || "D")
          );
        });
        break;
        
      case "LANGUAGE":
        // Check language proficiency
        requirementMet = reqs.every(req => {
          return qualifications.some(q => 
            q.type === "LANGUAGE_TEST" && 
            q.subject.toLowerCase() === req.subject?.toLowerCase() &&
            compareGrades(q.grade, req.minGrade || "")
          );
        });
        break;
        
      case "INTERVIEW":
      case "PORTFOLIO":
        // These typically can't be verified through qualifications alone
        // For now, we'll assume they're optional or will be completed later
        requirementMet = true;
        break;
        
      default:
        requirementMet = false;
    }
    
    if (!requirementMet) {
      return false;
    }
  }
  
  return true;
}

// Helper function to compare grades (simplified implementation)
function compareGrades(studentGrade: string, requiredGrade: string): boolean {
  const gradeOrder = ["A", "B", "C", "D", "E", "F"];
  
  // Handle numeric grades (e.g., GPA)
  if (!isNaN(Number(studentGrade)) && !isNaN(Number(requiredGrade))) {
    return Number(studentGrade) >= Number(requiredGrade);
  }
  
  // Handle letter grades
  const studentIndex = gradeOrder.indexOf(studentGrade.toUpperCase());
  const requiredIndex = gradeOrder.indexOf(requiredGrade.toUpperCase());
  
  if (studentIndex === -1 || requiredIndex === -1) {
    // If we can't parse the grades, be conservative and return false
    return false;
  }
  
  return studentIndex <= requiredIndex;
}

async function getRecentActivity(studentId: string) {
  // Get recent activity (applications submitted, qualifications added, etc.)
  const [recentApplications, recentQualifications] = await Promise.all([
    prisma.application.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        program: {
          include: {
            department: {
              include: {
                university: true
              }
            }
          }
        }
      }
    }),
    prisma.qualification.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ]);

  return [
    ...recentApplications.map(app => ({
      type: 'application' as const,
      id: app.id,
      title: `Applied to ${app.program.name}`,
      description: app.program.department.university.name,
      timestamp: app.createdAt,
      status: app.status
    })),
    ...recentQualifications.map(qual => ({
      type: 'qualification' as const,
      id: qual.id,
      title: `Added ${qual.subject} qualification`,
      description: `${qual.type} - Grade: ${qual.grade}`,
      timestamp: qual.createdAt,
      status: qual.verified ? 'verified' : 'pending'
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
   .slice(0, 5);
}

function getDefaultStudentAnalytics() {
  return {
    totalMatches: 0,
    matchesThisWeek: 0,
    totalApplications: 0,
    pendingApplications: 0,
    draftApplications: 0,
    totalQualifications: 0,
    verifiedQualifications: 0,
    recentMatches: [],
    upcomingDeadlines: [],
    recommendedCourses: [],
    recentActivity: [],
    qualificationStats: {
      total: 0,
      verified: 0,
      highSchool: 0,
      undergraduate: 0
    },
    applications: []
  };
}




