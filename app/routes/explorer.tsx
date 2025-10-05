import { useState, useMemo, useCallback } from "react";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Building2,
  GraduationCap,
  Users,
  Search,
  MapPin,
  Star,
  ChevronRight,
  Filter,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Award,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import {
  getUniversities,
  getDepartments,
  getPrograms,
} from "@/utils/models/data.service";
import { generateUniversityLogo } from "~/utils/logo-generator";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const [universities, departments, programs] = await Promise.all([
      getUniversities(),
      getDepartments(),
      getPrograms(),
    ]);

    // Transform universities with generated logos - ONLY ONCE
    const universitiesWithLogos = universities.map((uni) => {
      const logoUrl = generateUniversityLogo(uni.name, uni.slug);

      return {
        id: uni.id,
        name: uni.name,
        slug: uni.slug,
        location: uni.location || "Various locations", // Use actual location if available
        rating: 4.0 + Math.random(),
        description: `${uni.name} is a leading institution with ${
          uni.departments?.length || 0
        } departments.`,
        imageUrl: logoUrl, // Use the generated logo
        studentCount: Math.floor(Math.random() * 20000) + 5000,
        established: Math.floor(Math.random() * 200) + 1820,
      };
    });

    const transformedData = {
      universities: universitiesWithLogos, // Use the transformed universities
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        universityId: dept.universityId,
        university: {
          name: dept.university.name,
          slug: dept.university.slug,
        },
      })),
      programs: programs.map((program) => ({
        id: program.id,
        name: program.name,
        departmentId: program.departmentId || "",
        department: {
          name: program.department?.name || "General Studies",
          university: {
            name: program.department?.university?.name || "University",
          },
        },
        duration: ["2 years", "3 years", "4 years", "5 years"][
          Math.floor(Math.random() * 4)
        ],
        degreeType: ["BACHELOR", "MASTER", "PHD", "CERTIFICATE"][
          Math.floor(Math.random() * 4)
        ],
      })),
    };

    return transformedData;
  } catch (error) {
    console.error("Error loading homepage data:", error);
    return {
      universities: [],
      departments: [],
      programs: [],
    };
  }
}

interface University {
  id: string;
  name: string;
  slug: string;
  location: string;
  rating: number;
  imageUrl?: string;
  description: string;
  studentCount?: number;
  established?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  universityId: string;
  university: {
    name: string;
    slug: string;
  };
}

interface Program {
  id: string;
  name: string;
  departmentId: string;
  department: {
    name: string;
    university: {
      name: string;
    };
  };
  duration: string;
  degreeType: string;
}

interface SidebarFilters {
  search: string;
  university: string;
  department: string;
  programType: string;
  minRating: number;
  location: string;
}

export default function UniversityExplorer() {
  const data = useLoaderData<typeof loader>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "universities" | "departments" | "programs"
  >("universities");
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SidebarFilters>({
    search: "",
    university: "",
    department: "",
    programType: "",
    minRating: 0,
    location: "",
  });

  // Memoized filtered results for better performance
  const filteredUniversities = useMemo(() => {
    return data.universities.filter(
      (uni) =>
        (uni.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          uni.location.toLowerCase().includes(filters.search.toLowerCase()) ||
          (filters.location &&
            uni.location
              .toLowerCase()
              .includes(filters.location.toLowerCase()))) &&
        uni.rating >= filters.minRating
    );
  }, [data.universities, filters.search, filters.minRating, filters.location]);

  const filteredDepartments = useMemo(() => {
    return data.departments.filter(
      (dept) =>
        (dept.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          dept.code.toLowerCase().includes(filters.search.toLowerCase()) ||
          dept.university.name
            .toLowerCase()
            .includes(filters.search.toLowerCase())) &&
        (!filters.university || dept.universityId === filters.university)
    );
  }, [data.departments, filters.search, filters.university]);

  const filteredPrograms = useMemo(() => {
    return data.programs.filter(
      (program) =>
        (program.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          program.department.name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          program.department.university.name
            .toLowerCase()
            .includes(filters.search.toLowerCase())) &&
        (!filters.department || program.departmentId === filters.department) &&
        (!filters.programType || program.degreeType === filters.programType)
    );
  }, [data.programs, filters.search, filters.department, filters.programType]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      university: "",
      department: "",
      programType: "",
      minRating: 0,
      location: "",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== "" && value !== 0);
  }, [filters]);

  // Get unique universities for filter dropdown
  const universityOptions = useMemo(() => {
    return Array.from(
      new Map(
        data.departments.map((dept) => [
          dept.universityId,
          { id: dept.universityId, name: dept.university.name },
        ])
      ).values()
    );
  }, [data.departments]);

  // Get unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    return data.departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      university: dept.university.name,
    }));
  }, [data.departments]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Home Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-r from-blue-900 to-purple-800 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('/inner-pages/3.jpeg')",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6">
              Discover Your Perfect University
            </h1>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Explore thousands of programs, departments, and universities to
              find your ideal academic path
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button
                onClick={() => navigate("/universities")}
                className="bg-white text-blue-900 border-2 border-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                View Universities{" "}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => navigate("/departments")}
                className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors text-sm sm:text-base"
              >
                View Departments
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white rounded-lg p-4 sm:p-6 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1 sm:mb-2">
              {data.universities.length}+
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              Universities
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1 sm:mb-2">
              {data.departments.length}+
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              Departments
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 sm:p-6 text-center shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1 sm:mb-2">
              {data.programs.length}+
            </div>
            <div className="text-sm sm:text-base text-gray-600">Programs</div>
          </div>
        </div>

        {/* Mobile sidebar toggle */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full text-sm font-medium text-gray-700 bg-white px-4 py-3 rounded-lg border border-gray-300 shadow-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {sidebarOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Mobile overlay, desktop sidebar */}
          <div
            className={`
              bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300
              ${
                sidebarOpen
                  ? "w-full h-auto max-h-[80vh] overflow-y-auto fixed sm:relative top-0 left-0 z-50 sm:z-auto m-4 sm:m-0"
                  : "hidden lg:block lg:w-20 lg:h-fit"
              }
              lg:sticky lg:top-4 lg:self-start
              ${!sidebarOpen ? "lg:hover:w-80 lg:hover:opacity-100" : ""}
            `}
          >
            {/* Close button for mobile overlay */}
            {sidebarOpen && (
              <div className="sm:hidden flex justify-end p-2 border-b border-gray-200">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                  <h2 className="text-lg font-semibold text-gray-900">
                    Browse & Filter
                  </h2>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
                  aria-label={
                    sidebarOpen ? "Collapse filters" : "Expand filters"
                  }
                >
                  {sidebarOpen ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <Filter className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {sidebarOpen && (
              <div className="p-4 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Global Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search universities, departments, programs..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Navigation Tabs - Mobile optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "universities",
                        label: "Uni",
                        fullLabel: "Universities",
                        icon: Building2,
                      },
                      {
                        id: "departments",
                        label: "Dept",
                        fullLabel: "Departments",
                        icon: Users,
                      },
                      {
                        id: "programs",
                        label: "Prog",
                        fullLabel: "Programs",
                        icon: GraduationCap,
                      },
                    ].map(({ id, label, fullLabel, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`
                          p-2 text-xs sm:text-sm font-medium rounded-lg transition-colors 
                          flex flex-col items-center justify-center min-h-[60px] sm:min-h-0
                          ${
                            activeTab === id
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }
                        `}
                        title={fullLabel}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-center">{label}</span>
                        <span className="sr-only">{fullLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                {activeTab === "universities" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Rating
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={filters.minRating}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              minRating: parseFloat(e.target.value),
                            })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 min-w-[40px]">
                          {filters.minRating}+
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by location..."
                        value={filters.location}
                        onChange={(e) =>
                          setFilters({ ...filters, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                    </div>
                  </>
                )}

                {activeTab === "departments" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by University
                    </label>
                    <select
                      value={filters.university}
                      onChange={(e) =>
                        setFilters({ ...filters, university: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">All Universities</option>
                      {universityOptions.map((uni) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === "programs" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree Type
                      </label>
                      <select
                        value={filters.programType}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            programType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">All Types</option>
                        <option value="BACHELOR">Bachelor</option>
                        <option value="MASTER">Master</option>
                        <option value="PHD">PhD</option>
                        <option value="CERTIFICATE">Certificate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) =>
                          setFilters({ ...filters, department: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">All Departments</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.university})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 transition-colors py-2 border border-gray-200 rounded-lg"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">
                    {activeTab}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {activeTab === "universities" &&
                      `${filteredUniversities.length} universities found`}
                    {activeTab === "departments" &&
                      `${filteredDepartments.length} departments found`}
                    {activeTab === "programs" &&
                      `${filteredPrograms.length} programs found`}
                  </p>
                </div>
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 transition-colors sm:hidden w-full sm:w-auto mt-2 sm:mt-0 py-2 border border-gray-200 rounded-lg"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Show filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4 sm:gap-6">
              {activeTab === "universities" &&
                filteredUniversities.map((university) => (
                  <UniversityCard key={university.id} university={university} />
                ))}

              {activeTab === "departments" &&
                filteredDepartments.map((department) => (
                  <DepartmentCard key={department.id} department={department} />
                ))}

              {activeTab === "programs" &&
                filteredPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}

              {/* Empty State */}
              {(activeTab === "universities" &&
                filteredUniversities.length === 0) ||
              (activeTab === "departments" &&
                filteredDepartments.length === 0) ||
              (activeTab === "programs" && filteredPrograms.length === 0) ? (
                <div className="text-center py-8 sm:py-12">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No {activeTab} found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
                    Try adjusting your search criteria or browse all {activeTab}
                    .
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UniversityCard({ university }: { university: University }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start space-y-4 space-x-2 sm:space-y-0 sm:space-x-6">
        {university.imageUrl && (
          <img
            src={university.imageUrl}
            alt={university.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0 mx-auto sm:mx-0"
          />
        )}
        <div className="flex-1 min-w-0 text-center sm:text-left ml-2">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {university.name}
          </h3>
          <div className="flex items-center justify-center sm:justify-start text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate text-sm sm:text-base">
              {university.location}
            </span>
          </div>
          <div className="flex items-center justify-center sm:justify-start mb-4">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(university.rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              ({university.rating.toFixed(1)}/5)
            </span>
          </div>
          <p className="text-gray-700 mb-4 line-clamp-2 text-sm sm:text-base">
            {university.description}
          </p>
          <div className="flex justify-center sm:justify-start">
            <Link
              to={`/universities/${university.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base group"
            >
              View details
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
            {department.name}
          </h3>
          <p className="text-gray-600 font-mono text-xs sm:text-sm mb-2">
            {department.code}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
            {department.university.name}
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Link
            to={`/departments/${department.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group whitespace-nowrap"
          >
            View Programs
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {program.name}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600 mb-2">
            <span className="flex items-center justify-center sm:justify-start">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {program.degreeType.toLowerCase()}
            </span>
            <span className="flex items-center justify-center sm:justify-start">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {program.duration}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
            {program.department.name} • {program.department.university.name}
          </p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Link
            to={`/programs/${program.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm group whitespace-nowrap"
          >
            Learn More
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
