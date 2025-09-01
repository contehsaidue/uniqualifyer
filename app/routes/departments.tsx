// app/routes/departments.tsx
import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  Search,
  Filter,
  BookOpen,
  Building2,
  ChevronRight,
} from "lucide-react";
import { getDepartments } from "@/utils/models/data.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const departments = await getDepartments();
  return json({ departments });
}

export default function DepartmentsPage() {
  const { departments } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-4">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Academic Departments
          </h1>
          <p className="text-gray-600">
            Browse all academic departments across our universities
          </p>
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
                  placeholder="Search departments..."
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

        {/* Departments Grid */}
        <div className="grid gap-6">
          {departments.length > 0 ? (
            departments.map((department) => (
              <div
                key={department.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {department.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        <span>{department.university.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {department.code}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Offers various programs in the field of{" "}
                      {department.name.toLowerCase()}.
                    </p>
                  </div>
                  <Link
                    to={`/departments/${department.id}`}
                    className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
                  >
                    View Department
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No departments found
              </h3>
              <p className="text-gray-600">
                There are currently no departments available.
              </p>
            </div>
          )}
        </div>

        {/* Pagination would go here */}
        {departments.length > 0 && (
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
