import { StatCard } from "@/components/shared/StatCard";
import { Building2, Users, BookOpen } from "lucide-react";

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

interface SuperAdminDashboardProps {
  analytics: any;
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

export default function SuperAdminDashboard({
  analytics,
}: SuperAdminDashboardProps) {
  console.log("Analytics data:", analytics);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          System Analytics
        </h1>
        <p className="text-gray-600 mb-6 md:mb-8">Loading analytics data...</p>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading data...</div>
        </div>
      </div>
    );
  }

  const analyticsData = analytics;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <p className="text-gray-600 mb-6 md:mb-8">
        Overview of universities, departments, and users analytics
      </p>

      {/* University Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
          title="Total Universities"
          value={analyticsData.totalUniversities}
          change={`${analyticsData.activeUniversities} with departments`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />}
          title="Total Departments"
          value={analyticsData.totalDepartments}
          change={`${analyticsData.departmentsPerUniversity} avg per university`}
        />
        <StatCard
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />}
          title="Total Users"
          value={analyticsData.totalUsers}
          change="All platform users"
        />
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />}
          title="Super Admins"
          value={analyticsData.superAdmins}
          change="System administrators"
        />
        <StatCard
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-teal-600" />}
          title="Department Admins"
          value={analyticsData.departmentAdmins}
          change="University administrators"
        />
        <StatCard
          icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />}
          title="Students"
          value={analyticsData.students}
          change="Platform learners"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* User Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            User Distribution
          </h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.userDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name}: ${(percent * 100)?.toFixed(0)}%`
                  }
                >
                  {analyticsData.userDistributionData?.map(
                    (entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Universities by Department Count
          </h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={analyticsData.universityStatsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="departments" fill="#8884d8" name="Departments" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* University Stats Detailed Chart */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          University Statistics (Departments and Users)
        </h3>
        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={analyticsData.universityStatsData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="departments" fill="#0088FE" name="Departments" />
              <Bar dataKey="users" fill="#00C49F" name="Users" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
