// app/routes/universities.tsx
import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  Search,
  Filter,
  Building2,
  BookOpen,
  Users,
  ChevronRight,
} from "lucide-react";
import { getUniversities } from "@/utils/models/data.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const universities = await getUniversities();
  return { universities };
}

export default function UniversitiesPage() {
  const { universities } = useLoaderData<typeof loader>();

  // Calculate program counts for each university
  const universitiesWithStats = universities.map((uni) => ({
    ...uni,
    programCount: uni.departments.reduce(
      (total, dept) => total + (dept.Program?.length || 0),
      0
    ),
    departmentCount: uni.departments.length,
  }));

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
            backgroundImage: "url('/inner-pages/2.jpeg')",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Universities
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Explore thousands of universities to find your ideal academic path
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
                  placeholder="Search universities..."
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

        {/* Universities Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {universitiesWithStats.length > 0 ? (
            universitiesWithStats.map((university) => (
              <div
                key={university.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {university.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>{university.programCount} programs</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{university.departmentCount} departments</span>
                  </div>
                </div>
                <Link
                  to={`/universities/${university.slug}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No universities found
              </h3>
              <p className="text-gray-600">
                There are currently no universities available.
              </p>
            </div>
          )}
        </div>

        {/* Pagination would go here */}
        {universitiesWithStats.length > 0 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 rounded bg-blue-600 text-white">
                1
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
