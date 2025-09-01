// app/routes/departments.$id.tsx
import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  Building2,
  BookOpen,
  Users,
  Mail,
  Phone,
  GraduationCap,
  FileText,
} from "lucide-react";
import { getDepartmentById } from "@/utils/models/department.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const department = await getDepartmentById(params.id as string);

  if (!department) {
    throw new Response("Department not found", { status: 404 });
  }

  return { department };
}

export default function DepartmentDetail() {
  const { department } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/departments"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Departments
        </Link>
      </div>

      {/* Department Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            {/* Department Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {department.name}
              </h1>
              <div className="flex items-center text-gray-600 mb-3">
                <Building2 className="w-5 h-5 mr-2" />
                <span className="text-lg">{department.university.name}</span>
              </div>
              <p className="text-gray-600">
                Department Code:{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {department.code}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                About the {department.name} Department
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The {department.name} Department at {department.university.name}
                offers comprehensive academic programs designed to prepare
                students for successful careers in the field. Our curriculum
                combines theoretical knowledge with practical applications to
                ensure graduates are well-equipped for the challenges of the
                modern workforce.
              </p>
            </div>

            {/* Programs Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Academic Programs
              </h2>
              <div className="space-y-4">
                {department.Program && department.Program.length > 0 ? (
                  department.Program.map((program) => (
                    <div
                      key={program.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">
                            {program.name}
                          </h3>

                          {/* Program Requirements */}
                          {program.requirements &&
                            program.requirements.length > 0 && (
                              <div className="mt-3">
                                <h4 className="font-medium text-gray-700 text-sm mb-2">
                                  Admission Requirements:
                                </h4>
                                <div className="space-y-2">
                                  {program.requirements.map((requirement) => (
                                    <div
                                      key={requirement.id}
                                      className="flex items-start text-sm text-gray-600"
                                    >
                                      <FileText className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium">
                                          {requirement.type}
                                          {requirement.subject &&
                                            ` - ${requirement.subject}`}
                                          :
                                        </span>
                                        {requirement.minGrade && (
                                          <span>
                                            {" "}
                                            Minimum {requirement.minGrade}
                                          </span>
                                        )}
                                        {requirement.description && (
                                          <p className="text-gray-500 mt-1">
                                            {requirement.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                        <Link
                          to={`/programs/${program.id}`}
                          className="ml-4 text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap text-sm"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No programs available in this department yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Department Facts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Department Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">
                    {department.Program?.length || 0} Programs
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">500+ Students</span>
                </div>
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">25+ Faculty Members</span>
                </div>
              </div>
            </div>

            {/* University Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                University Information
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>University:</strong> {department.university.name}
                </p>
                <p>
                  <strong>Department Code:</strong> {department.code}
                </p>
                <p>
                  <strong>Established:</strong> 1985
                </p>
                <p>
                  <strong>Accreditation:</strong> Fully Accredited
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">
                    {department.code.toLowerCase()}@
                    {department.university.name
                      .toLowerCase()
                      .replace(/\s+/g, "-")}
                    .edu
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">+1 (555) 765-4321</span>
                </div>
                <div className="text-gray-600">
                  <strong>Office Hours:</strong> Mon-Fri, 8:30AM-5:00PM
                </div>
                <div className="text-gray-600">
                  <strong>Location:</strong> Science Building, Room 301
                </div>
              </div>
            </div>

            {/* Application CTA */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">
                Interested in Our Programs?
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
          </div>
        </div>
      </div>
    </div>
  );
}
