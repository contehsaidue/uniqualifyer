import { USER_ROLES } from "@/utils/constants";
import {
  BarChart,
  BookOpen,
  Users,
  FileText,
  Settings,
  UserCheck2Icon,
  UserCircle2,
  SchoolIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Link, useLocation } from "@remix-run/react";

type SidebarProps = {
  user: {
    role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
  };
};

export function Sidebar({ user }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const menuItems = [
    {
      id: "dashboard",
      to: "/dashboard",
      icon: <BarChart className="h-5 w-5" />,
      label: "Dashboard",
      roles: [
        USER_ROLES.STUDENT,
        USER_ROLES.DEPARTMENT_ADMINISTRATOR,
        USER_ROLES.SUPER_ADMIN,
      ],
    },
    {
      id: "roles",
      to: "/roles",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
      label: "Roles Management",
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      id: "users",
      to: "/users",
      icon: <UserCheck2Icon className="h-5 w-5" />,
      label: "Users Management",
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      id: "universities",
      to: "/universities",
      icon: <SchoolIcon className="h-5 w-5" />,
      label: "Universities Management",
      roles: [USER_ROLES.SUPER_ADMIN],
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
      id: "applicants",
      to: "/applicants",
      icon: <Users className="h-5 w-5" />,
      label: "Applicants",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "programs",
      to: "/programs",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Programs",
      roles: [USER_ROLES.DEPARTMENT_ADMINISTRATOR],
    },
    {
      id: "settings",
      to: "/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      roles: [
        USER_ROLES.STUDENT,
        USER_ROLES.DEPARTMENT_ADMINISTRATOR,
        USER_ROLES.SUPER_ADMIN,
      ],
    },
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <nav className="space-y-1">
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
    </div>
  );
}
