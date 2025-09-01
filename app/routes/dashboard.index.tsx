import {
  type LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useLoaderData } from "@remix-run/react";
import { USER_ROLES } from "@/utils/constants";
import StudentDashboard from "./dashboard.applicant";
import DepartmentAdminDashboard from "./dashboard.admin";
import SuperAdminDashboard from "./dashboard.super";
import { getCurrentDateTime } from "~/utils/getTimeBasedGreeting";
import {
  SunIcon,
  SparklesIcon,
  MoonIcon,
  CalendarIcon,
  ClockIcon,
} from "lucide-react";
import {
  fetchDepartmentAdminAnalyticsData,
  fetchStudentAnalyticsData,
  fetchSuperAdminAnalyticsData,
} from "~/utils/helperFunctions";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");

  const user = await getUserBySession(refreshToken);
  if (!user) {
    if (refreshToken) {
      throw redirect("/auth/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
    throw redirect("/auth/login");
  }

  let analytics = null;
  let studentAnalytics = null;
  let departmentAdminAnalytics = null;

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    analytics = await fetchSuperAdminAnalyticsData();
  } else if (user.role === USER_ROLES.STUDENT) {
    studentAnalytics = await fetchStudentAnalyticsData(user.id);
  } else if (user.role === USER_ROLES.DEPARTMENT_ADMINISTRATOR) {
    departmentAdminAnalytics = await fetchDepartmentAdminAnalyticsData(user.id);
  }

  return { user, analytics, studentAnalytics, departmentAdminAnalytics };
}

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard | UniQualifyer" },
    { name: "description", content: "Your personalized dashboard" },
  ];
};

export default function DashboardIndex() {
  const { user, analytics, studentAnalytics, departmentAdminAnalytics } =
    useLoaderData<typeof loader>();
  console.log("User data in DashboardIndex:", user);
  const now = new Date();
  const hour = now.getHours();
  const { greeting, currentDate, currentTime } = getCurrentDateTime();

  const TimeIcon = hour < 12 ? SunIcon : hour < 18 ? SparklesIcon : MoonIcon;
  const iconColor =
    hour < 12
      ? "text-yellow-500"
      : hour < 18
      ? "text-blue-400"
      : "text-indigo-500";

  const renderDashboard = () => {
    switch (user.role) {
      case USER_ROLES.STUDENT:
        return <StudentDashboard analytics={studentAnalytics} />;
      case USER_ROLES.DEPARTMENT_ADMINISTRATOR:
        return (
          <DepartmentAdminDashboard
            analytics={departmentAdminAnalytics}
            user={user}
          />
        );
      case USER_ROLES.SUPER_ADMIN:
        return <SuperAdminDashboard analytics={analytics} />;
      default:
        return <div>No dashboard available for your role</div>;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="group">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <div
            className={`p-2 rounded-full bg-opacity-20 ${
              hour < 12
                ? "bg-yellow-100"
                : hour < 18
                ? "bg-blue-100"
                : "bg-indigo-100"
            }`}
          >
            <TimeIcon
              className={`h-6 w-6 ${iconColor} transition-all duration-300 group-hover:scale-110`}
            />
          </div>
          <div>
            <span className="text-blue-600">
              {greeting}, {user ? user.name : "User"}!
            </span>
            <div className="mt-2 text-sm font-medium text-gray-600 flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-1 transition-all duration-300 group-hover:text-blue-500" />
              <span className="text-gray-800 font-medium">{currentDate}</span>
              <span className="mx-2 text-gray-400">•</span>
              <ClockIcon className="h-5 w-5 text-gray-400 mr-1 transition-all duration-300 group-hover:text-blue-500" />
              <span className="text-gray-800 font-medium">{currentTime}</span>
            </div>
          </div>
        </h2>
      </div>
      {renderDashboard()}
    </div>
  );
}
