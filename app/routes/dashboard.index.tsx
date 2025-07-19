import { Header } from "@/components/shared/Header";
import { Sidebar } from "@/components/shared/Sidebar";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useLoaderData } from "@remix-run/react";
import { USER_ROLES } from "@/utils/constants";
import StudentDashboard from "./dashboard.student";
import DepartmentAdminDashboard from "./dashboard.department";
import SuperAdminDashboard from "./dashboard.super";

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

  return { user };
}

export default function DashboardIndex() {
  const { user } = useLoaderData<typeof loader>();

  const renderDashboard = () => {
    switch (user.role) {
      case USER_ROLES.STUDENT:
        return <StudentDashboard />;
      case USER_ROLES.DEPARTMENT_ADMINISTRATOR:
        return <DepartmentAdminDashboard />;
      case USER_ROLES.SUPER_ADMIN:
        return <SuperAdminDashboard />;
      default:
        return <div>No dashboard available for your role</div>;
    }
  };

  const getDashboardTitle = () => {
    switch (user.role) {
      case USER_ROLES.STUDENT:
        return "Student Dashboard";
      case USER_ROLES.DEPARTMENT_ADMINISTRATOR:
        return "Department Admin Dashboard";
      case USER_ROLES.SUPER_ADMIN:
        return "Super Admin Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Sidebar user={user} />
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {getDashboardTitle()}
              </h2>
              {renderDashboard()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
