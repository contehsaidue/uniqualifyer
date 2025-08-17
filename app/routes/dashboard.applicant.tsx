import { StatCard } from "@/components/shared/StatCard";
import { BookOpen, BarChart, FileText, Bell } from "lucide-react";

export default function ApplicantDashboard() {
  // Mock data
  const studentData = {
    name: "Alex Johnson",
    eligibilityMatches: 12,
    applications: 3,
    recommendedCourses: 5,
    recentUpdates: [
      {
        id: 1,
        text: "New match: Computer Science at Stanford",
        time: "2h ago",
      },
      {
        id: 2,
        text: "Application deadline approaching for MIT",
        time: "1d ago",
      },
    ],
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
          title="Eligibility Matches"
          value={studentData.eligibilityMatches}
          change="+2 this week"
        />
        <StatCard
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          title="Applications"
          value={studentData.applications}
          change="1 in progress"
        />
        <StatCard
          icon={<BarChart className="h-6 w-6 text-purple-600" />}
          title="Recommended Courses"
          value={studentData.recommendedCourses}
          change="New recommendations"
        />
      </div>

      {/* Recent Activity */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Updates
        </h3>
        <div className="space-y-4">
          {studentData.recentUpdates.map((item) => (
            <div
              key={item.id}
              className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0"
            >
              <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{item.text}</p>
                <p className="text-sm text-gray-500">{item.time}</p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
