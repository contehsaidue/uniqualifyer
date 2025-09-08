import { StatCard } from "@/components/shared/StatCard";
import { BookOpen, FileText, Users, Bell } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DepartmentAdminDashboardProps {
  analytics: any;
  user: any;
}

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

// Application status colors
const STATUS_COLORS = {
  PENDING: "#FFBB28",
  UNDER_REVIEW: "#0088FE",
  APPROVED: "#00C49F",
  REJECTED: "#FF8042",
  CONDITIONAL: "#8884D8",
  DRAFT: "#9CA3AF",
};

export default function DepartmentAdminDashboard({
  analytics,
  user,
}: DepartmentAdminDashboardProps) {
  console.log("Department analytics data:", analytics);
  console.log("User data:", user);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Department Dashboard
        </h1>
        <p className="text-gray-600 mb-6 md:mb-8">Loading analytics data...</p>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading data...</div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const applicationStatusData = [
    {
      name: "Pending",
      value: analytics.pendingApplications || 0,
      color: STATUS_COLORS.PENDING,
    },
    {
      name: "Under Review",
      value: analytics.underReviewApplications || 0,
      color: STATUS_COLORS.UNDER_REVIEW,
    },
    {
      name: "Approved",
      value: analytics.approvedApplications || 0,
      color: STATUS_COLORS.APPROVED,
    },
    {
      name: "Rejected",
      value: analytics.rejectedApplications || 0,
      color: STATUS_COLORS.REJECTED,
    },
    {
      name: "Conditional",
      value: analytics.conditionalApplications || 0,
      color: STATUS_COLORS.CONDITIONAL,
    },
  ];

  const programApplicationsData =
    analytics.programs
      ?.map((program: any) => ({
        name:
          program.name.length > 15
            ? `${program.name.substring(0, 15)}...`
            : program.name,
        applications: program.applicationCount || 0,
        requirements: program.requirementsCount || 0,
      }))
      .sort((a: any, b: any) => b.applications - a.applications)
      .slice(0, 8) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<BookOpen className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />}
          title="Programs"
          value={analytics.totalPrograms || 0}
          change="+2 this week"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
          title="Requirements"
          value={analytics.totalRequirements || 0}
          change={`${analytics.todaysApplications || 0} new today`}
        />
        <StatCard
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />}
          title="Applicants"
          value={analytics.totalApplications || 0}
          change={`${analytics.newRecommendations || 0} new recommendations`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Application Status Distribution */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Application Status Distribution
          </h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applicationStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name}: ${(percent * 100)?.toFixed(0)}%`
                  }
                >
                  {applicationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} applications`, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Programs by Application Count */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Programs by Application Count
          </h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={programApplicationsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="applications"
                  fill="#8884d8"
                  name="Applications"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Updates
        </h3>
        <div className="space-y-4">
          {analytics.recentUpdates?.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0"
            >
              <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{item.message}</p>
                <p className="text-sm text-gray-500">{item.timeAgo}</p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View
              </button>
            </div>
          ))}
          {(!analytics.recentUpdates ||
            analytics.recentUpdates.length === 0) && (
            <p className="text-gray-500 text-center py-4">No recent updates</p>
          )}
        </div>
      </div>

      {/* User Info Sidebar */}
      <div className="bg-white shadow-lg rounded-xl p-5 md:p-7 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-semibold text-gray-800">
            Department Information
          </h3>
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Admin
          </div>
        </div>

        <div className="space-y-4">
          <div className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Department
            </p>
            <p className="font-medium text-gray-900 text-lg mt-1">
              {analytics.departmentName || "N/A"}
            </p>
          </div>

          <div className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              University
            </p>
            <p className="font-medium text-gray-900 text-lg mt-1">
              {analytics.universityName || "N/A"}
            </p>
          </div>

          <div className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Role
            </p>
            <p className="font-medium text-gray-900 text-lg mt-1">
              Department Administrator
            </p>
          </div>

          <div className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Email
            </p>
            <p className="font-medium text-gray-900 text-lg mt-1 break-all">
              {user?.email || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
