import { StatCard } from "@/components/shared/StatCard";
import {
  BookOpen,
  FileText,
  BarChart,
  Bell,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface StudentDashboardProps {
  analytics: any;
}

// Colors for status badges
const STATUS_COLORS = {
  [ApplicationStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [ApplicationStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [ApplicationStatus.UNDER_REVIEW]: "bg-blue-100 text-blue-800",
  [ApplicationStatus.APPROVED]: "bg-green-100 text-green-800",
  [ApplicationStatus.REJECTED]: "bg-red-100 text-red-800",
  [ApplicationStatus.CONDITIONAL]: "bg-purple-100 text-purple-800",
};

const STATUS_ICONS = {
  [ApplicationStatus.PENDING]: Clock,
  [ApplicationStatus.DRAFT]: FileText,
  [ApplicationStatus.UNDER_REVIEW]: AlertCircle,
  [ApplicationStatus.APPROVED]: CheckCircle,
  [ApplicationStatus.REJECTED]: AlertCircle,
  [ApplicationStatus.CONDITIONAL]: AlertCircle,
};

export default function StudentDashboard({ analytics }: StudentDashboardProps) {
  console.log("Student analytics data:", analytics);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 mb-6 md:mb-8">Loading dashboard data...</p>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading data...</div>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const StatusIcon = STATUS_ICONS[status];
    const statusText = status.replace("_", " ").toLowerCase();
    const formattedText =
      statusText.charAt(0).toUpperCase() + statusText.slice(1);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
      >
        <StatusIcon className="h-3 w-3 mr-1" />
        {formattedText}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<Target className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />}
          title="Eligibility Matches"
          value={analytics.totalMatches}
          change={`+${analytics.matchesThisWeek} this week`}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
          title="Total Applications"
          value={analytics.totalApplications}
          change={`${analytics.pendingApplications} pending`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />}
          title="Qualifications"
          value={analytics.totalQualifications}
          change={`${analytics.verifiedQualifications} verified`}
        />
        <StatCard
          icon={<BarChart className="h-5 w-5 md:h-6 md:w-6 text-green-600" />}
          title="Recommended Courses"
          value={analytics.recommendedCourses?.length || 0}
          change="New recommendations"
        />
      </div>

      {/* Recent Applications */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-purple-600 mr-2" />
          Recent Applications
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.applications?.slice(0, 5).map((app: any) => (
                <tr key={app.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.program?.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.program?.department?.university?.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString()
                      : "Not submitted"}
                  </td>
                </tr>
              ))}
              {(!analytics.applications ||
                analytics.applications.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Courses */}
      <div className="bg-white shadow rounded-lg p-4 md:p-6 md:mb-8 mt-6 md:mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart className="h-5 w-5 text-green-600 mr-2" />
          Recommended Courses
        </h3>
        <div className="space-y-3">
          {analytics.recommendedCourses?.slice(0, 4).map((course: any) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {course.name}
                </p>
                <p className="text-xs text-gray-500">{course.provider}</p>
              </div>
              <span
                className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                  course.relevance === "High"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {course.relevance}
              </span>
            </div>
          ))}
          {(!analytics.recommendedCourses ||
            analytics.recommendedCourses.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recommended courses
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8 mt-6 md:mt-8">
        {/* Recent Matches */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-indigo-600 mr-2" />
            Recent Matches
          </h3>
          <div className="space-y-3">
            {analytics.recentMatches?.slice(0, 3).map((match: any) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {match.programName}
                  </p>
                  <p className="text-xs text-gray-500">{match.university}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    {match.matchScore}% match
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{match.timeAgo}</p>
                </div>
              </div>
            ))}
            {(!analytics.recentMatches ||
              analytics.recentMatches.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent matches
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 text-blue-600 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {analytics.recentActivity?.slice(0, 5).map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0"
              >
                <div className="bg-blue-100 p-2 rounded-lg mr-4">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimeAgo(new Date(activity.timestamp))}
                  </p>
                </div>
                {activity.type === "application" && (
                  <div className="ml-2">{getStatusBadge(activity.status)}</div>
                )}
              </div>
            ))}
            {(!analytics.recentActivity ||
              analytics.recentActivity.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
