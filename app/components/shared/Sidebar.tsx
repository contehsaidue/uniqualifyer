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
} from "lucide-react";
import { Link, useLocation, Form } from "@remix-run/react";

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
      to: "/requirements",
      icon: <BookOpenCheckIcon className="h-5 w-5" />,
      label: "Requirements",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "applicants",
      to: "/applicants",
      icon: <Users className="h-5 w-5" />,
      label: "Applicants",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "matches",
      to: "/matches",
      icon: <BookOpen className="h-5 w-5" />,
      label: "My Matches",
      roles: [USER_ROLES.STUDENT],
    },
    {
      id: "applications",
      to: "/applications",
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
    const form = document.getElementById("logout-form") as HTMLFormElement;
    if (form) form.requestSubmit();
  };

  return (
    <div className="flex flex-col h-full w-full md:w-64 flex-shrink-0">
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-2">
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors duration-200 group">
          <div className="relative  transition-all duration-300">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-medium text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>

          {/* User info with better typography */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.65rem] font-medium bg-indigo-300 text-indigo-800">
                {user.role}
              </span>
            </div>

            <p className="text-xs truncate flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {user.email}
            </p>

            {/* Status indicator (optional) */}
            <div className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-1.5"></span>
              <span className="text-[0.65rem]">Active now</span>
            </div>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="space-y-1">
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
      </div>
    </div>
  );
}
