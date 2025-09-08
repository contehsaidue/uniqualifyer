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
