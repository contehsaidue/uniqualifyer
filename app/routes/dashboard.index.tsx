import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/shared/StatCard';
import { BookOpen, BarChart, Users, FileText, CheckCircle, Bell } from 'lucide-react';
import { useState } from 'react';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { getSession, destroySession } from '@/utils/session.server';
import { getUserBySession } from '@/services/auth.service';
import { useLoaderData } from '@remix-run/react';
import { USER_ROLES } from '@/utils/constants';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const refreshToken = session.get('refreshToken');
  
  const user = await getUserBySession(refreshToken);
  if (!user) {
    if (refreshToken) {
      throw redirect('/auth/login', {
        headers: {
          'Set-Cookie': await destroySession(session)
        }
      });
    }
    throw redirect('/auth/login');
  }
  
  return { user };
}

type DashboardData = {
  name: string;
  eligibilityMatches: number;
  applications: number;
  recommendedCourses: number;
  recentUpdates: Array<{ id: number; text: string; time: string }>;
};

type AdminData = {
  university: string;
  applications: number;
  newApplications: number;
  acceptanceRate: string;
  recentActivity: Array<{ id: number; text: string; time: string }>;
};

export default function DashboardIndex() {
  const { user } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data with proper typing
  const studentData: DashboardData = {
    name: "Alex Johnson",
    eligibilityMatches: 12,
    applications: 3,
    recommendedCourses: 5,
    recentUpdates: [
      { id: 1, text: "New match: Computer Science at Stanford", time: "2h ago" },
      { id: 2, text: "Application deadline approaching for MIT", time: "1d ago" }
    ]
  };

  const adminData: AdminData = {
    university: "Stanford University",
    applications: 1245,
    newApplications: 42,
    acceptanceRate: "8.3%",
    recentActivity: [
      { id: 1, text: "New application received from Alex Johnson", time: "30m ago" },
      { id: 2, text: "Admission committee meeting scheduled", time: "2h ago" }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          
          {/* Dashboard Content */}
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {user.role === USER_ROLES.STUDENT ? 'Student Dashboard' : 'Admissions Dashboard'}
              </h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {user.role === USER_ROLES.STUDENT ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <StatCard 
                      icon={<Users className="h-6 w-6 text-indigo-600" />}
                      title="Total Applications"
                      value={adminData.applications}
                      change={`${adminData.newApplications} new`}
                    />
                    <StatCard 
                      icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                      title="Acceptance Rate"
                      value={adminData.acceptanceRate}
                      change="Last year: 7.9%"
                    />
                    <StatCard 
                      icon={<BarChart className="h-6 w-6 text-purple-600" />}
                      title="Average GPA"
                      value="3.92"
                      change="Last year: 3.89"
                    />
                  </>
                )}
              </div>
              
              {/* Recent Activity */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {user.role === USER_ROLES.STUDENT ? 'Recent Updates' : 'Recent Activity'}
                </h3>
                <div className="space-y-4">
                  {(user.role === USER_ROLES.STUDENT ? studentData.recentUpdates : adminData.recentActivity).map(item => (
                    <div key={item.id} className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                        <Bell className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{item.text}</p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}