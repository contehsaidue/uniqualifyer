import { GraduationCap, Search, Menu } from "lucide-react";
import { useState } from "react";
import { Form } from "@remix-run/react";

type HeaderProps = {
  user: any;
};

export default function Header({ user }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutModal(true);
    setMobileMenuOpen(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    const form = document.getElementById("logout-form") as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center gap-4">
          <button
            className="p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <a
            href="/dashboard/index"
            className="flex items-center hover:opacity-80 transition-opacity mx-auto"
            aria-label="Go to homepage"
          >
            <GraduationCap className="h-8 w-8 text-indigo-600" />
          </a>

          <div className="flex items-center">
            <a
              href="/dashboard/profile"
              className="flex items-center"
              aria-label="User profile"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            </a>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                  aria-label="Mobile search"
                />
              </div>
            </div>
            <nav className="space-y-2">
              <a
                href="/dashboard/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </a>
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
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

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
    </>
  );
}
