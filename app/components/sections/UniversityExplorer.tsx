import { useState, useMemo, useCallback } from "react";
import { Link } from "@remix-run/react";
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
} from "lucide-react";

export interface University {
  id: string;
  name: string;
  slug: string;
  location: string;
  rating: number;
  imageUrl?: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  universityId: string;
  university: {
    name: string;
    slug: string;
  };
}

export interface Program {
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

export interface HomepageData {
  universities: University[];
  departments: Department[];
  programs: Program[];
}

export interface SidebarFilters {
  search: string;
  university: string;
  department: string;
  programType: string;
  minRating: number;
}

export function UniversityExplorer({ data }: { data: HomepageData }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "universities" | "departments" | "programs"
  >("universities");
  const [filters, setFilters] = useState<SidebarFilters>({
    search: "",
    university: "",
    department: "",
    programType: "",
    minRating: 0,
  });

  // Memoized filtered results for better performance
  const filteredUniversities = useMemo(() => {
    return data.universities.filter(
      (uni) =>
        (uni.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          uni.location.toLowerCase().includes(filters.search.toLowerCase())) &&
        uni.rating >= filters.minRating
    );
  }, [data.universities, filters.search, filters.minRating]);

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
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      (value) => value !== "" && value !== 0 && value !== false
    );
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 shadow-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {sidebarOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div
            className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
              sidebarOpen ? "w-80" : "w-0 opacity-0 lg:opacity-100 lg:w-20"
            } lg:block ${
              sidebarOpen ? "" : "lg:hover:w-80 lg:hover:opacity-100"
            }`}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                  <h2 className="text-lg font-semibold text-gray-900">
                    Browse & Filter
                  </h2>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              <div className="p-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "universities",
                        label: "Universities",
                        icon: Building2,
                      },
                      { id: "departments", label: "Departments", icon: Users },
                      {
                        id: "programs",
                        label: "Programs",
                        icon: GraduationCap,
                      },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`p-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                          activeTab === id
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="ml-1 hidden lg:inline">{label}</span>
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
                      <div className="flex items-center space-x-2">
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
                          className="w-full"
                        />
                        <span className="text-sm text-gray-600 w-8">
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
                        value={filters.search}
                        onChange={(e) =>
                          setFilters({ ...filters, search: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {activeTab}
                  </h2>
                  <p className="text-gray-600">
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
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Show filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-6">
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
                (activeTab === "programs" && filteredPrograms.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {activeTab} found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or browse all{" "}
                      {activeTab}.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for better organization
function UniversityCard({ university }: { university: University }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-6">
        {university.imageUrl && (
          <img
            src={university.imageUrl}
            alt={university.name}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {university.name}
          </h3>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{university.location}</span>
          </div>
          <div className="flex items-center mb-4">
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
          <p className="text-gray-700 mb-4 line-clamp-2">
            {university.description}
          </p>
          <Link
            to={`/universities/${university.slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group"
          >
            View details
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {department.name}
          </h3>
          <p className="text-gray-600 font-mono text-sm mb-2">
            {department.code}
          </p>
          <p className="text-sm text-gray-500">
            <Building2 className="w-4 h-4 inline mr-1" />
            {department.university.name}
          </p>
        </div>
        <Link
          to={`/departments/${department.id}`}
          className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group whitespace-nowrap"
        >
          View Programs
          <ExternalLink className="w-4 h-4 ml-1 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {program.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              {program.degreeType.toLowerCase()}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {program.duration}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            <BookOpen className="w-4 h-4 inline mr-1" />
            {program.department.name} • {program.department.university.name}
          </p>
        </div>
        <Link
          to={`/programs/${program.id}`}
          className="ml-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group whitespace-nowrap"
        >
          Learn More
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
