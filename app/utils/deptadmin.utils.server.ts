import prisma from "~/lib/prisma.server";
import { UserRole, ApplicationStatus, QualificationType } from "@prisma/client";

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