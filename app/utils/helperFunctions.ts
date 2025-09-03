import prisma from "@/lib/prisma";
import { UserRole, ApplicationStatus, QualificationType } from "@prisma/client";

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

// Helper functions for student or applicant
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

// Helper function to calculate time ago (short format) for department admins
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

import { google, youtube_v3 } from 'googleapis';

const youtube = google.youtube('v3');

// YouTube API setup
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'your-youtube-api-key';

interface RecommendedCourse {
  id: string;
  name: string;          // Changed from 'title' to 'name'
  provider: string;      // Changed from 'channelTitle' to 'provider'
  description: string;
  thumbnail: string;
  url: string;
  duration: string;
  viewCount: number;
  publishedAt: string;
  relevance: string;    
  skills: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  playlist?: boolean;
}

// Add these constants at the top
const YOUTUBE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_DAY = 50; // Conservative limit for free tier
let dailyRequestCount = 0;
let lastResetTime = Date.now();

// Reset counter daily
setInterval(() => {
  dailyRequestCount = 0;
  lastResetTime = Date.now();
}, 24 * 60 * 60 * 1000);

interface StudentProfile {
  program: {
    name: string;
    department: {
      name: string;
    };
  } | null;
  qualifications: Array<{
    type: string;
    subject: string;
    grade: string;
  }>;
  applications: Array<{
    program: {
      name: string;
      department: {
        name: string;
      };
      requirements: Array<{
        subject: string;
        minGrade: string;
      }>;
    };
  }>;
}

async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      qualifications: true,
      applications: {
        include: {
          program: {
            include: {
              department: true,
              requirements: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Get program information from the first application
  const firstApplication = student.applications[0];
  let programInfo = null;

  if (firstApplication) {
    programInfo = {
      name: firstApplication.program.name,
      department: {
        name: firstApplication.program.department.name
      }
    };
  }

  return {
    program: programInfo,
    qualifications: student.qualifications,
    applications: student.applications.map(app => ({
      program: {
        name: app.program.name,
        department: {
          name: app.program.department.name
        },
        requirements: app.program.requirements.map(req => ({
          subject: req.subject || '',
          minGrade: req.minGrade || ''
        }))
      }
    }))
  };
}

function generateSearchQueries(profile: StudentProfile): string[] {
  const queries: string[] = [];
  
  // Use program from profile or fallback
  const programName = profile.program?.name || 'computer science';
  const departmentName = profile.program?.department.name || 'technology';

  // Program-based queries
  queries.push(
    `${programName} full course`,
    `${programName} tutorial`,
    `${departmentName} fundamentals`,
    `learn ${programName} from scratch`
  );

  // Qualification-based queries
  profile.qualifications.forEach(qual => {
    if (qual.type === 'HIGH_SCHOOL' || qual.type === 'UNDERGRADUATE') {
      queries.push(
        `${qual.subject} for beginners`,
        `${qual.subject} crash course`,
        `advanced ${qual.subject}`
      );
    } else if (qual.type === 'LANGUAGE_TEST') {
      queries.push(
        `${qual.subject} language course`,
        `${qual.subject} test preparation`,
        `master ${qual.subject}`
      );
    }
  });

  // Application requirements-based queries
  profile.applications.forEach(app => {
    app.program.requirements.forEach(req => {
      if (req.subject) {
        queries.push(
          `${req.subject} preparation`,
          `${req.subject} ${req.minGrade || 'required'} level`,
          `master ${req.subject}`
        );
      }
    });
  });

  // Remove duplicates and return
  return [...new Set(queries)].slice(0, 10);
}

async function searchYouTubeVideos(query: string, maxResults: number = 5): Promise<RecommendedCourse[]> {
  // Check rate limits
  if (dailyRequestCount >= MAX_REQUESTS_PER_DAY) {
    console.warn('YouTube API daily quota exceeded, using fallback');
    return [];
  }

  try {
    dailyRequestCount++;
    
    const response = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ['snippet'],
      q: `${query} free course`,
      type: ['video'],
      maxResults,
      order: 'relevance',
      relevanceLanguage: 'en'
    });

    return response.data.items?.map(item => {
      const videoId = item.id?.videoId;
      
      return {
        id: videoId || '',
        name: item.snippet?.title || 'Untitled',
        provider: item.snippet?.channelTitle || 'Unknown Channel',
        description: item.snippet?.description || '',
        thumbnail: item.snippet?.thumbnails?.high?.url || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        duration: '',
        viewCount: 0,
        publishedAt: item.snippet?.publishedAt || '',
        relevance: 'Medium',
        skills: extractSkillsFromTitle(item.snippet?.title || ''),
        difficulty: determineDifficulty(item.snippet?.title || ''),
        playlist: false
      };
    }) || [];

  } catch (error: any) {
    if (error.code === 403 && error.message.includes('quota')) {
      console.warn('YouTube API quota exceeded, using fallback');
      return [];
    }
    console.error('YouTube API error:', error);
    return [];
  }
}

// Also update the fallback courses to match:
function getCuratedFallbackCourses(): RecommendedCourse[] {
  return [
    {
      id: "fallback-1",
      name: "CS50's Introduction to Computer Science", // name instead of title
      provider: "freeCodeCamp.org", // provider instead of channelTitle
      description: "Harvard's famous CS50 course taught by David Malan",
      thumbnail: "https://i.ytimg.com/vi/8mAITcNt710/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=8mAITcNt710",
      duration: "PT24H",
      viewCount: 10000000,
      publishedAt: "2022-01-01T00:00:00Z",
      relevance: "High",
      skills: ["programming", "computer science", "algorithms"],
      difficulty: "Beginner",
      playlist: true
    },
    {
      id: "fallback-2",
      name: "Mathematics for Machine Learning", // name instead of title
      provider: "3Blue1Brown", // provider instead of channelTitle
      description: "Essential mathematics for understanding machine learning",
      thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=aircAruvnKk",
      duration: "PT6H",
      viewCount: 5000000,
      publishedAt: "2022-01-01T00:00:00Z",
      relevance: "High",
      skills: ["mathematics", "machine learning", "linear algebra"],
      difficulty: "Intermediate",
      playlist: true
    }
  ];
}

function extractSkillsFromTitle(title: string): string[] {
  const skills: string[] = [];
  const commonSkills = [
    'python', 'javascript', 'java', 'c++', 'html', 'css', 'react', 
    'node.js', 'sql', 'database', 'algorithm', 'data structure',
    'calculus', 'algebra', 'statistics', 'physics', 'chemistry',
    'machine learning', 'ai', 'web development', 'mobile development'
  ];

  commonSkills.forEach(skill => {
    if (title.toLowerCase().includes(skill)) {
      skills.push(skill);
    }
  });

  return skills.slice(0, 5);
}

function determineDifficulty(title: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('beginner') || lowerTitle.includes('basic') || lowerTitle.includes('intro')) {
    return 'Beginner';
  }
  if (lowerTitle.includes('advanced') || lowerTitle.includes('expert') || lowerTitle.includes('master')) {
    return 'Advanced';
  }
  return 'Intermediate';
}

async function getVideoDetails(videoIds: string[]): Promise<Map<string, { duration: string, viewCount: number }>> {
  if (videoIds.length === 0) return new Map();

  try {
    const response = await youtube.videos.list({
      key: YOUTUBE_API_KEY,
      part: ['contentDetails', 'statistics'],
      id: videoIds
    });

    const detailsMap = new Map();
    response.data.items?.forEach(video => {
      if (video.id) {
        detailsMap.set(video.id, {
          duration: video.contentDetails?.duration || '',
          viewCount: parseInt(video.statistics?.viewCount || '0')
        });
      }
    });

    return detailsMap;
  } catch (error) {
    console.error('YouTube video details error:', error);
    return new Map();
  }
}

function calculateRelevanceScore(course: RecommendedCourse, profile: StudentProfile): number {
  let score = 0;
  const title = course.name.toLowerCase();
  const programName = profile.program?.name.toLowerCase() || '';
  const departmentName = profile.program?.department.name.toLowerCase() || '';

  // Program relevance
  if (programName && title.includes(programName)) score += 30;
  if (departmentName && title.includes(departmentName)) score += 20;

  // Qualification relevance
  profile.qualifications.forEach(qual => {
    const subject = qual.subject.toLowerCase();
    if (title.includes(subject)) score += 15;
  });

  // Application requirements relevance
  profile.applications.forEach(app => {
    app.program.requirements.forEach(req => {
      if (req.subject && title.includes(req.subject.toLowerCase())) {
        score += 10;
      }
    });
  });

  // Content quality signals
  if (course.viewCount > 100000) score += 5;
  if (course.duration && parseDuration(course.duration) > 3600) score += 8;
  if (course.playlist) score += 12;

  // Difficulty matching
  if (course.difficulty === 'Beginner' && hasBeginnerQualifications(profile)) score += 10;
  if (course.difficulty === 'Advanced' && hasAdvancedQualifications(profile)) score += 10;

  return score;
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration format (PT1H30M15S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

function hasBeginnerQualifications(profile: StudentProfile): boolean {
  return profile.qualifications.some(q => 
    (q.type === 'HIGH_SCHOOL' || q.type === 'UNDERGRADUATE') && 
    ['A', 'B', 'C'].includes(q.grade.toUpperCase())
  );
}

function hasAdvancedQualifications(profile: StudentProfile): boolean {
  return profile.qualifications.some(q => 
    q.type === 'LANGUAGE_TEST' || 
    q.grade === 'A' ||
    (q.type === 'UNDERGRADUATE' && ['A', 'B'].includes(q.grade.toUpperCase()))
  );
}

export async function getRecommendedCourses(userId: string): Promise<RecommendedCourse[]> {
  try {
    // Get student profile
    const profile = await getStudentProfile(userId);
    
    // Generate search queries
    const queries = generateSearchQueries(profile);
    
    // Search YouTube for each query
    const allCourses: RecommendedCourse[] = [];
    
    for (const query of queries) {
      const courses = await searchYouTubeVideos(query, 3);
      allCourses.push(...courses);
    }

    // Remove duplicates
    const uniqueCourses = allCourses.filter((course, index, self) =>
      index === self.findIndex(c => c.id === course.id)
    );

    // Get video details for non-playlists
    const videoIds = uniqueCourses.filter(c => !c.playlist).map(c => c.id);
    const videoDetails = await getVideoDetails(videoIds);

    // Enrich courses with details
    const enrichedCourses = uniqueCourses.map(course => {
      if (!course.playlist && videoDetails.has(course.id)) {
        const details = videoDetails.get(course.id)!;
        return {
          ...course,
          duration: details.duration,
          viewCount: details.viewCount
        };
      }
      return course;
    });

    // Calculate relevance scores
    const scoredCourses = enrichedCourses.map(course => ({
      ...course,
      relevanceScore: calculateRelevanceScore(course, profile)
    }));

    // Sort by relevance and quality
    scoredCourses.sort((a, b) => {
      // Primary sort by relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Secondary sort by view count (popularity)
      return b.viewCount - a.viewCount;
    });

    // Categorize relevance
    const recommendedCourses = scoredCourses.slice(0, 15).map((course, index) => {
      let relevance: 'High' | 'Medium' | 'Low' = 'Medium';
      
      if (course.relevanceScore >= 50) relevance = 'High';
      else if (course.relevanceScore <= 20) relevance = 'Low';

      // Boost top 3 results to High relevance
      if (index < 3 && relevance !== 'High') relevance = 'High';

      return {
        ...course,
        relevance,
        relevanceScore: undefined // Remove score from final output
      };
    });

    // Cache results for 24 hours
    await cacheRecommendations(userId, recommendedCourses);

    return recommendedCourses;

  } catch (error) {
    console.error('Error getting recommended courses:', error);
    
    // Fallback to curated courses if YouTube fails
    return getCuratedFallbackCourses();
  }
}

export async function cacheRecommendations(userId: string, courses: RecommendedCourse[]): Promise<void> {
  await prisma.recommendationCache.upsert({
    where: { userId },
    update: {
      courses: JSON.stringify(courses),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    create: {
      userId,
      courses: JSON.stringify(courses),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

// Additional utility function to get cached recommendations
export async function getCachedRecommendations(userId: string): Promise<RecommendedCourse[]> {
  const cached = await prisma.recommendationCache.findUnique({
    where: { userId }
  });

  if (cached && new Date(cached.expiresAt) > new Date()) {
    return JSON.parse(cached.courses);
  }

  return getRecommendedCourses(userId);
}

// Add this validation function
function validateYouTubeSetup(): void {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  if (process.env.YOUTUBE_API_KEY === 'your_actual_api_key_here') {
    throw new Error('Please replace the placeholder YouTube API key in your .env file');
  }
}

// Call this when your app starts
validateYouTubeSetup();