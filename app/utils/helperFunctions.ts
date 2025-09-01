import prisma from "@/lib/prisma";
import { UserRole, ApplicationStatus, QualificationType } from "@prisma/client";

/**
 * Super administrator analytics
 */
export async function fetchSuperAdminAnalyticsData() {
  try {
    const [
      totalUniversities,
      universitiesWithDepartments,
      totalDepartments,
      totalUsers,
      superAdmins,
      departmentAdmins,
      students,
      universitiesWithStats,
    ] = await Promise.all([
      prisma.university.count().catch(() => 0),
      prisma.university
        .count({
          where: { departments: { some: {} } },
        })
        .catch(() => 0),
      prisma.department.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.user
        .count({ where: { role: UserRole.SUPER_ADMIN } })
        .catch(() => 0),
      prisma.user
        .count({ where: { role: UserRole.DEPARTMENT_ADMINISTRATOR } })
        .catch(() => 0),
      prisma.user.count({ where: { role: UserRole.STUDENT } }).catch(() => 0),
      prisma.university
        .findMany({
          take: 8,
          include: {
            _count: {
              select: {
                departments: true,
              },
            },
            departments: {
              include: {
                _count: {
                  select: {
                    administrators: true,
                  },
                },
              },
            },
          },
          orderBy: {
            departments: {
              _count: "desc",
            },
          },
        })
        .catch(() => []),
    ]);

    const departmentsPerUniversity =
      totalUniversities > 0
        ? (totalDepartments / totalUniversities).toFixed(1)
        : "0";

    const universityStatsData = universitiesWithStats.map((uni) => ({
      name: uni.name.length > 12 ? `${uni.name.substring(0, 12)}...` : uni.name,
      departments: uni._count?.departments || 0,
      users:
        uni.departments?.reduce(
          (total, dept) => total + (dept._count?.administrators || 0),
          0
        ) || 0,
    }));

    const userDistributionData = [
      { name: "Super Admins", value: superAdmins },
      { name: "Dept Admins", value: departmentAdmins },
      { name: "Students", value: students },
    ];

    return {
      totalUniversities: totalUniversities || 0,
      activeUniversities: universitiesWithDepartments || 0,
      totalDepartments: totalDepartments || 0,
      departmentsPerUniversity,
      totalUsers: totalUsers || 0,
      superAdmins: superAdmins || 0,
      departmentAdmins: departmentAdmins || 0,
      students: students || 0,
      universityStatsData: universityStatsData || [],
      userDistributionData: userDistributionData || [],
    };
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return {
      totalUniversities: 0,
      activeUniversities: 0,
      totalDepartments: 0,
      departmentsPerUniversity: "0",
      totalUsers: 0,
      superAdmins: 0,
      departmentAdmins: 0,
      students: 0,
      universityStatsData: [],
      userDistributionData: [
        { name: "Super Admins", value: 0 },
        { name: "Dept Admins", value: 0 },
        { name: "Students", value: 0 },
      ],
    };
  }
}

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

    // Get program matches count (you'll need to implement your matching logic)
    const programMatches = await getProgramMatchesCount(userId);
    
    // Get recent matches (last 7 days)
    const recentMatches = await getRecentMatches(userId);
    
    // Get recommended courses
    const recommendedCourses = await getRecommendedCourses(userId);

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
      recentMatches,
      recommendedCourses,
      recentActivity,
      qualificationStats,
      applications: student.applications.slice(0, 5), 
    };
  } catch (error) {
    console.error("Student analytics fetch error:", error);
    return getDefaultStudentAnalytics();
  }
}

// Helper functions
async function getProgramMatchesCount(userId: string) {
  // Implement your program matching logic here
  // This is a placeholder - replace with your actual matching service
  const total = await prisma.program.count(); // Example
  const thisWeek = Math.floor(Math.random() * 5) + 1; // Example random weekly matches
  
  return { total, thisWeek };
}

async function getRecentMatches(userId: string) {
  // Get recently matched programs (last 7 days)
  // Replace with your actual matching logic
  return [
    {
      id: "1",
      programName: "Computer Science at Stanford",
      university: "Stanford University",
      matchScore: 92,
      timeAgo: "2h ago"
    }
  ];
}

async function getRecommendedCourses(userId: string) {
  // Get recommended courses based on student's qualifications and interests
  // This is a placeholder - implement your recommendation logic
  return [
    {
      id: "1",
      name: "Advanced Mathematics",
      provider: "Coursera",
      relevance: "High"
    },
    {
      id: "2", 
      name: "Python Programming",
      provider: "edX",
      relevance: "Medium"
    }
  ];
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

// Types for better TypeScript support
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


/**
 * Department administrator analytics
 */
export async function fetchDepartmentAdminAnalyticsData(userId: string) {
  try {
    console.log("Fetching analytics for user ID:", userId);
    
    // First find the department administrator by userId to get department info
    const departmentAdmin = await prisma.departmentAdministrator.findUnique({
      where: { userId: userId },
      include: {
        department: {
          include: {
            university: true
          }
        }
      }
    });

    console.log("Department admin found:", departmentAdmin);

    if (!departmentAdmin) {
      throw new Error("Department administrator not found");
    }

    if (!departmentAdmin.department) {
      // Department admin exists but has no department assigned
      console.log("Department admin has no department assigned");
      return {
        departmentName: "No Department Assigned",
        universityName: "N/A",
        totalPrograms: 0,
        totalRequirements: 0,
        totalApplications: 0,
        pendingApplications: 0,
        underReviewApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        conditionalApplications: 0,
        draftApplications: 0,
        recentApplications: 0,
        todaysApplications: 0,
        newRecommendations: 0,
        recentUpdates: [],
        programs: []
      };
    }

    const department = departmentAdmin.department;
    console.log("Department found:", department.name);

    // Use the same pattern as getApplicationsForDepartmentAdmin service
    const applications = await prisma.application.findMany({
      where: {
        program: {
          departmentId: department.id
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            qualifications: {
              select: {
                type: true,
                subject: true,
                grade: true,
                verified: true
              }
            }
          }
        },
        program: {
          include: {
            department: {
              include: {
                university: true
              }
            }
          }
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("Total applications found:", applications.length);

    // Get programs for the department
    const programs = await prisma.program.findMany({
      where: {
        departmentId: department.id
      },
      include: {
        requirements: true,
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    console.log("Programs found:", programs.length);

    // Count applications by status
    const pendingApplications = applications.filter(app => app.status === ApplicationStatus.PENDING).length;
    const underReviewApplications = applications.filter(app => app.status === ApplicationStatus.UNDER_REVIEW).length;
    const approvedApplications = applications.filter(app => app.status === ApplicationStatus.APPROVED).length;
    const rejectedApplications = applications.filter(app => app.status === ApplicationStatus.REJECTED).length;
    const conditionalApplications = applications.filter(app => app.status === ApplicationStatus.CONDITIONAL).length;
    const draftApplications = applications.filter(app => app.status === ApplicationStatus.DRAFT).length;
    
    // Get recent applications (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentApplications = applications
      .filter(app => app.submittedAt && new Date(app.submittedAt) >= oneWeekAgo)
      .length;
    
    // Get today's new applications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysApplications = applications
      .filter(app => app.submittedAt && new Date(app.submittedAt) >= today)
      .length;
    
    // Get new recommendations (applications that need attention)
    const newRecommendations = applications
      .filter(app => 
        app.status === ApplicationStatus.PENDING || 
        app.status === ApplicationStatus.UNDER_REVIEW
      )
      .length;

    // Calculate total requirements across all programs
    const totalRequirements = programs.reduce(
      (total, program) => total + program.requirements.length, 0
    );

    // Get recent updates (last 5 applications with notes or status changes)
    const recentUpdates = applications
      .filter(app => app.notes.length > 0 || app.status !== ApplicationStatus.PENDING)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(app => ({
        message: app.notes.length > 0 
          ? `New note added to ${app.student.user.name}'s application` 
          : `Application status changed to ${app.status.toLowerCase().replace('_', ' ')} for ${app.student.user.name}`,
        timeAgo: getTimeAgo(new Date(app.updatedAt))
      }));

    const result = {
      departmentName: department.name,
      universityName: department.university.name,
      totalPrograms: programs.length,
      totalRequirements,
      totalApplications: applications.length,
      pendingApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      conditionalApplications,
      draftApplications,
      recentApplications,
      todaysApplications,
      newRecommendations,
      recentUpdates,
      programs: programs.map(program => ({
        name: program.name,
        applicationCount: program._count.applications,
        requirementsCount: program.requirements.length
      }))
    };

    console.log("Analytics result:", result);
    return result;

  } catch (error) {
    console.error("Department admin analytics fetch error:", error);
    return {
      departmentName: "Error",
      universityName: "Error",
      totalPrograms: 0,
      totalRequirements: 0,
      totalApplications: 0,
      pendingApplications: 0,
      underReviewApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0,
      conditionalApplications: 0,
      draftApplications: 0,
      recentApplications: 0,
      todaysApplications: 0,
      newRecommendations: 0,
      recentUpdates: [],
      programs: []
    };
  }
}

// Helper function to calculate time ago (short format)
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}