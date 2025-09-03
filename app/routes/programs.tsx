// app/routes/programs.tsx
import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  Search,
  Filter,
  BookOpen,
  Building2,
  Award,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getPrograms } from "@/utils/models/data.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const programs = await getPrograms();
  return { programs };
}

export default function ProgramsPage() {
  const { programs } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/explorer"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explorer
        </Link>
      </div>

      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-r from-blue-900 to-purple-800 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover programs
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Explore thousands of programs to find your ideal academic path
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button className="flex items-center text-sm text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6">
          {programs.length > 0 ? (
            programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {program.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        <span>{program.department?.university?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span>{program.department?.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        <span>{program.department?.code}</span>
                      </div>
                    </div>
                    {program.requirements &&
                      program.requirements.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-700 text-sm mb-2">
                            Requirements:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {program.requirements.slice(0, 3).map((req) => (
                              <span
                                key={req.id}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {req.type}
                                {req.subject && `: ${req.subject}`}
                              </span>
                            ))}
                            {program.requirements.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                +{program.requirements.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                  <Link
                    to={`/programs/${program.id}`}
                    className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No programs found
              </h3>
              <p className="text-gray-600">
                There are currently no programs available.
              </p>
            </div>
          )}
        </div>

        {/* Pagination would go here */}
        {programs.length > 0 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">
                1
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
