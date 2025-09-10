import { USER_ROLES } from "@/utils/constants";
import {
  BarChart,
  BookOpen,
  Users,
  FileText,
  Settings,
  UserCheck2Icon,
  SchoolIcon,
  BookOpenCheckIcon,
  User,
  LogOut,
  BookOpenTextIcon,
  GraduationCap,
  X,
  FileQuestionMarkIcon,
  LucideFileQuestionMark,
  BookAlertIcon,
} from "lucide-react";
import { Link, useLocation, Form } from "@remix-run/react";
import { useState } from "react";

type SidebarProps = {
  user: {
    name: string;
    email: string;
    role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
    avatar?: string;
  };
};

export default function Sidebar({ user }: SidebarProps) {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const menuItems = [
    {
      id: "dashboard",
      to: "/dashboard/index",
      icon: <BarChart className="h-5 w-5" />,
      label: "Dashboard",
      roles: [
        USER_ROLES.STUDENT,
        USER_ROLES.DEPARTMENT_ADMINISTRATOR,
        USER_ROLES.SUPER_ADMIN,
      ],
    },
    {
      id: "universities",
      to: "/dashboard/universities",
      icon: <SchoolIcon className="h-5 w-5" />,
      label: "Universities",
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      id: "departments",
      to: "/dashboard/departments",
      icon: <BookOpenTextIcon className="h-5 w-5" />,
      label: "Departments",
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      id: "users",
      to: "/dashboard/users",
      icon: <UserCheck2Icon className="h-5 w-5" />,
      label: "Users",
      roles: [USER_ROLES.SUPER_ADMIN],
    },

    {
      id: "programs",
      to: "/dashboard/programs",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Programs",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "requirements",
      to: "/dashboard/requirements",
      icon: <BookOpenCheckIcon className="h-5 w-5" />,
      label: "Requirements",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "applicants",
      to: "/dashboard/applicants",
      icon: <Users className="h-5 w-5" />,
      label: "Applicants",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "qualifications",
      to: "/dashboard/qualifications",
      icon: <LucideFileQuestionMark className="h-5 w-5" />,
      label: "My Result",
      roles: [USER_ROLES.STUDENT],
    },
    {
      id: "matches",
      to: "/dashboard/matches",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Eligible Programs",
      roles: [USER_ROLES.STUDENT],
    },
    {
      id: "recommendations",
      to: "/dashboard/recommendations",
      icon: <BookAlertIcon className="h-5 w-5" />,
      label: "Recommendations",
      roles: [USER_ROLES.STUDENT],
    },
    {
      id: "applications",
      to: "/dashboard/applications",
      icon: <FileText className="h-5 w-5" />,
      label: "Applications",
      roles: [USER_ROLES.STUDENT],
    },
    {
      id: "settings",
      to: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      roles: [
        USER_ROLES.STUDENT,
        USER_ROLES.DEPARTMENT_ADMINISTRATOR,
        USER_ROLES.SUPER_ADMIN,
      ],
    },
  ];

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    const form = document.getElementById("logout-form") as HTMLFormElement;
    if (form) form.requestSubmit();
  };

  return (
    <div className="flex flex-col h-full w-full md:w-64 flex-shrink-0">
      <nav className="flex-1 space-y-1 p-2">
        <div className="hidden md:flex items-center justify-center mb-4">
          <Link
            to="/dashboard/index"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">UniQualifyer</h1>
          </Link>
        </div>
        {menuItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={[
                "flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200",
                isActive(item.to)
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")}
              prefetch="intent"
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
              {isActive(item.to) && (
                <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </Link>
          ))}
      </nav>

      <div className="mt-auto border-t border-gray-200 p-4">
        <div className="hidden md:flex flex-col items-center p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200 group w-65 text-center">
          <div className="mb-3 transition-transform duration-300 group-hover:scale-105">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white ring-offset-2 ring-offset-gray-50 mx-auto"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center ring-2 ring-white ring-offset-2 ring-offset-gray-50 mx-auto">
                <span className="text-gray-700 font-medium text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 truncate w-full mb-1">
            {user.name || "Unknown User"}
          </h3>

          <span
            className={`text-xs font-medium px-2 py-2.5 rounded-full mb-2 ${
              user.role === "SUPER ADMIN"
                ? "bg-purple-300 text-purple-800"
                : user.role === "DEPARTMENT ADMINISTRATOR"
                ? "bg-blue-300 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {user.role}
          </span>

          <div className="flex items-center justify-center text-sm text-gray-600 w-full truncate px-2">
            <svg
              className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate">{user.email}</span>
          </div>
        </div>
        {/* Profile Actions */}
        <div className="space-y-3 mt-3 hidden md:flex flex-col">
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 w-full"
          >
            <User className="h-4 w-4" />
            My Profile
          </Link>

          <Form
            method="post"
            action="/logout"
            id="logout-form"
            className="hidden"
          />
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {showLogoutModal && (
          <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6 mx-3">
                <p className="text-gray-600 mb-6">
                  Are you sure you want to sign out of your account?
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
