import { Header } from '@/components/shared/Header';
import { StatCard } from '@/components/shared/StatCard';
import { BookOpen, BarChart, Users, FileText, Settings } from 'lucide-react';
import { useState } from 'react';

export default function StudentDashboard() {
  const [userType, setUserType] = useState<'student' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data
  const studentData = {
    name: "Alex Johnson",
    eligibilityMatches: 12,
    applications: 3,
    recommendedCourses: 5,
    recentUpdates: [
      { id: 1, text: "New match: Computer Science at Stanford", time: "2h ago" },
      { id: 2, text: "Application deadline approaching for MIT", time: "1d ago" }
    ]
  };


  return (
    <div className="min-h-screen bg-gray-50">
    <Header/>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <BarChart className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              
             
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
              
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full px-4 py-3 rounded-lg ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </nav>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {userType === 'student' ? 'Student Dashboard' : 'Admissions Dashboard'}
              </h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               
                
                    <StatCard 
                      icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
                      title="Eligibility Matches"
                      value={studentData.eligibilityMatches}
                      change="+2 this week"
                    />
                    <StatCard 
                      icon={<FileText className="h-6 w-6 text-blue-600" />}
                      title="Applications"
                      value={studentData.applications}
                      change="1 in progress"
                    />
                    <StatCard 
                      icon={<BarChart className="h-6 w-6 text-purple-600" />}
                      title="Recommended Courses"
                      value={studentData.recommendedCourses}
                      change="New recommendations"
                    />
                
              </div>
              
           
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

