import { USER_ROLES } from '@/utils/constants';
import { BarChart, BookOpen, Users, FileText, Settings } from 'lucide-react';
import { useState } from 'react';

type SidebarProps = {
  user: any;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
};

export function Sidebar({ user, activeTab, setActiveTab }: SidebarProps)  {

  return (
    <>
      <div className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <BarChart className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              
              {user.role === USER_ROLES.STUDENT ? (
                <>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'matches' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <BookOpen className="mr-3 h-5 w-5" />
                    My Matches
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'applications' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    Applications
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('applicants')}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'applicants' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Applicants
                  </button>
                  <button
                    onClick={() => setActiveTab('programs')}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'programs' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <BookOpen className="mr-3 h-5 w-5" />
                    Programs
                  </button>
                </>
              )}
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </nav>
          </div>

    </>
  );
}