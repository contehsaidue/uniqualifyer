import { StatCard } from "@/components/shared/StatCard";
import {
  Building2,
  Users,
  BookOpen,
  BarChart,
  FileText,
  Bell,
  GraduationCap,
  Shield,
  UserCog,
} from "lucide-react";

type AdminStats = {
  totalUniversities: number;
  activeUniversities: number;
  totalDepartments: number;
  departmentsPerUniversity: number;
  totalUsers: number;
  superAdmins: number;
  departmentAdmins: number;
  recentActivity: Array<{ id: number; text: string; time: string }>;
  topUniversities: Array<{ name: string; departments: number }>;
};

export default function SuperAdminDashboard() {
  // Sample data - replace with actual data from your API
  const stats: AdminStats = {
    totalUniversities: 42,
    activeUniversities: 38,
    totalDepartments: 287,
    departmentsPerUniversity: 6.8,
    totalUsers: 5243,
    superAdmins: 12,
    departmentAdmins: 156,
    recentActivity: [
      {
        id: 1,
        text: "New university 'Tech Institute' registered with 8 departments",
        time: "2h ago",
      },
      {
        id: 2,
        text: "Department 'Computer Science' added to Stanford University",
        time: "1d ago",
      },
      {
        id: 3,
        text: "5 new department administrators onboarded",
        time: "2d ago",
      },
      {
        id: 4,
        text: "System maintenance completed - v2.3.0 deployed",
        time: "3d ago",
      },
    ],
    topUniversities: [
      { name: "Stanford University", departments: 12 },
      { name: "MIT", departments: 10 },
      { name: "Harvard University", departments: 9 },
      { name: "UC Berkeley", departments: 8 },
    ],
  };

  return (
    <>
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Building2 className="h-6 w-6 text-blue-600" />}
          title="Total Universities"
          value={stats.totalUniversities}
          change={`${stats.activeUniversities} active`}
        />
        <StatCard
          icon={<BookOpen className="h-6 w-6 text-purple-600" />}
          title="Total Departments"
          value={stats.totalDepartments}
          change={`Avg ${stats.departmentsPerUniversity.toFixed(
            1
          )} per university`}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-green-600" />}
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="Last 30 days"
        />
        <StatCard
          icon={<Shield className="h-6 w-6 text-amber-600" />}
          title="Administrators"
          value={stats.superAdmins + stats.departmentAdmins}
          change={`${stats.superAdmins} super, ${stats.departmentAdmins} dept`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<UserCog className="h-6 w-6 text-indigo-600" />}
          title="Department Admins"
          value={stats.departmentAdmins}
          change="5 new this month"
        />
        <StatCard
          icon={<GraduationCap className="h-6 w-6 text-teal-600" />}
          title="Top Universities"
          value={stats.topUniversities.length}
          change="By department count"
        />
        <StatCard
          icon={<BarChart className="h-6 w-6 text-rose-600" />}
          title="Growth Rate"
          value="+18%"
          change="Last quarter"
        />
      </div>

      {/* Top Universities */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Universities by Departments
        </h3>
        <div className="space-y-3">
          {stats.topUniversities.map((uni, index) => (
            <div key={uni.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-gray-500 w-6">{index + 1}.</span>
                <span className="font-medium">{uni.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">
                  {uni.departments} depts
                </span>
                <div
                  className="h-2 bg-blue-100 rounded-full"
                  style={{ width: `${uni.departments * 8}px` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Activity
        </h3>
        <div className="space-y-4">
          {stats.recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0"
            >
              <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{item.text}</p>
                <p className="text-sm text-gray-500 mt-1">{item.time}</p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium whitespace-nowrap">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
