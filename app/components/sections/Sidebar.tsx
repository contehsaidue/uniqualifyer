import { BookOpen, FileText, Users, BarChart, Settings } from 'lucide-react';

interface SidebarProps {
  userType: 'student' | 'admin';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ userType, activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <nav className="space-y-1">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <BarChart className="mr-3 h-5 w-5" />
          Dashboard
        </button>
        
        {userType === 'student' ? (
          <>
            <button
              onClick={() => onTabChange('matches')}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'matches' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <BookOpen className="mr-3 h-5 w-5" />
              My Matches
            </button>
            <button
              onClick={() => onTabChange('applications')}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'applications' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Applications
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTabChange('applicants')}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'applicants' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Users className="mr-3 h-5 w-5" />
              Applicants
            </button>
            <button
              onClick={() => onTabChange('programs')}
              className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'programs' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Programs
            </button>
          </>
        )}
        
        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
      </nav>
    </div>
  );
}