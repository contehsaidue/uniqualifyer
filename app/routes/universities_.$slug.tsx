import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { getUniversityBySlug } from "@/utils/models/university.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const university = await getUniversityBySlug(params.slug as string);

  if (!university) {
    throw new Response("University not found", { status: 404 });
  }

  return json({ university });
}

export default function UniversityDetail() {
  const { university } = useLoaderData<typeof loader>();

  // Calculate total programs across all departments
  const totalPrograms =
    university.departments?.reduce(
      (total, department) => total + (department.Program?.length || 0),
      0
    ) || 0;

  // Get all programs from all departments
  const allPrograms =
    university.departments?.flatMap((department) => department.Program || []) ||
    [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/universities"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Universities
        </Link>
      </div>

      {/* University Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            {/* University Logo/Image Placeholder */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {university.name}
              </h1>
              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="w-5 h-5 mr-1 flex-shrink-0" />
                <span className="text-lg">Various locations</span>
              </div>
              <p className="text-gray-600">
                A leading institution offering diverse academic programs across
                multiple departments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* University Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About {university.name}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {university.name} is a comprehensive university offering a wide
                range of academic programs through its{" "}
                {university.departments?.length || 0} departments. The
                institution is committed to providing quality education and
                fostering innovation across various fields of study.
              </p>
            </div>

            {/* Departments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Academic Departments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {university.departments?.map((department) => (
                  <div
                    key={department.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Code: {department.code}
                    </p>
                    <p className="text-sm text-gray-600">
                      {department.Program?.length || 0} program(s) available
                    </p>
                    {department.Program && department.Program.length > 0 && (
                      <Link
                        to={`/departments/${department.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                      >
                        View programs →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Programs Overview Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Programs Overview
              </h2>
              <div className="space-y-4">
                {allPrograms.slice(0, 10).map((program) => (
                  <div
                    key={program.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {program.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {/* Find the department that this program belongs to */}
                          {university.departments?.find((dept) =>
                            dept.Program?.some((p) => p.id === program.id)
                          )?.name || "General Studies"}
                        </p>
                      </div>
                      <Link
                        to={`/programs/${program.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap ml-4"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
                {allPrograms.length > 10 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/programs"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {allPrograms.length} programs →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Facts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                University Facts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    {university.departments?.length || 0} Departments
                  </span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    {totalPrograms} Programs
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    10,000+ Students
                  </span>
                </div>
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    500+ Faculty members
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">
                    admissions@{university.slug}.edu
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">
                    www.{university.slug}.edu
                  </span>
                </div>
              </div>
            </div>

            {/* Application CTA */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">
                Interested in Applying?
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Explore our programs and start your application process today.
              </p>
              <Link
                to="/programs"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
              >
                Browse Programs
              </Link>
            </div>

            {/* Departments Quick Links */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Departments</h3>
              <div className="space-y-2">
                {university.departments?.slice(0, 5).map((department) => (
                  <Link
                    key={department.id}
                    to={`/departments/${department.id}`}
                    className="block text-sm text-gray-600 hover:text-gray-900 py-1"
                  >
                    {department.name} ({department.code})
                  </Link>
                ))}
                {university.departments &&
                  university.departments.length > 5 && (
                    <Link
                      to="/departments"
                      className="block text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
                    >
                      View all departments →
                    </Link>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
