import prisma from "@/lib/prisma";
import { UserRole, ApplicationStatus, QualificationType } from "@prisma/client";
import { google, youtube_v3 } from 'googleapis';

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

export enum RequirementType {
  GRADE = "GRADE",
  COURSE = "COURSE", 
  LANGUAGE = "LANGUAGE",
  INTERVIEW = "INTERVIEW",
  PORTFOLIO = "PORTFOLIO"
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

const youtube = google.youtube('v3');

// YouTube API setup
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'your-youtube-api-key';

interface RecommendedCourse {
  id: string;
  name: string;         
  provider: string;     
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
const YOUTUBE_CACHE_DURATION = 24 * 60 * 60 * 1000; 
const MAX_REQUESTS_PER_DAY = 50; 
let dailyRequestCount = 0;
let lastResetTime = Date.now();

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

async function getProgramMatchesCount(userId: string) {
  try {
    // Get the student with their qualifications
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

// Helper function to check if student qualifications meet program requirements
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


// Reset counter daily
setInterval(() => {
  dailyRequestCount = 0;
  lastResetTime = Date.now();
}, 24 * 60 * 60 * 1000);



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