import { GraduationCap, Search, Bell, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { Link, Form } from "@remix-run/react";

type HeaderProps = {
  user: any;
};

export default function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const form = document.getElementById("logout-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
        {/* Logo Section */}
        <Link
          to="/dashboard/index"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          aria-label="Go to homepage"
        >
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
            UniQualifyer
          </h1>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search universities, programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                         hover:border-gray-400 transition-colors"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className="p-1 text-gray-500 hover:text-gray-700 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                <Link
                  to="/profile"
                  className="flex px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 items-center"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Settings
                </Link>
                <Form
                  method="post"
                  action="/logout"
                  id="logout-form"
                  className="hidden"
                >
                  <button type="submit">Logout</button>
                </Form>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border-t border-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
