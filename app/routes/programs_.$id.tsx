import { useLoaderData, Link } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { getProgramById } from "@/utils/models/program.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const program = await getProgramById(params.id as string);

  if (!program) {
    throw new Response("Program not found", { status: 404 });
  }

  return json({ program });
}

// Define proper types for the loaded data
interface ProgramRequirement {
  id: string;
  type: string;
  subject?: string;
  minGrade?: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  university: {
    id: string;
    name: string;
    slug: string;
  };
  Program?: Array<{
    id: string;
    name: string;
  }>;
}

interface Program {
  id: string;
  name: string;
  department?: Department;
  requirements?: ProgramRequirement[];
}

interface LoaderData {
  program: Program;
}

export default function ProgramDetail() {
  const { program } = useLoaderData<LoaderData>();

  // Helper function to get requirement icon based on type
  const getRequirementIcon = (type: string) => {
    switch (type) {
      case "GRADE":
        return <GraduationCap className="w-5 h-5 text-blue-500" />;
      case "LANGUAGE":
        return <FileText className="w-5 h-5 text-green-500" />;
      case "COURSE":
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      case "INTERVIEW":
        return <Users className="w-5 h-5 text-orange-500" />;
      case "PORTFOLIO":
        return <FileText className="w-5 h-5 text-pink-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper function to get requirement type label
  const getRequirementTypeLabel = (type: string) => {
    switch (type) {
      case "GRADE":
        return "Academic Requirement";
      case "LANGUAGE":
        return "Language Proficiency";
      case "COURSE":
        return "Course Prerequisite";
      case "INTERVIEW":
        return "Interview";
      case "PORTFOLIO":
        return "Portfolio Submission";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/programs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Link>
      </div>

      {/* Program Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {program.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              <span>
                {program.department?.university?.name || "University"}
              </span>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              <span>{program.department?.name || "Department"}</span>
            </div>
            {program.department?.code && (
              <div className="flex items-center">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                  {program.department.code}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Program Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Program Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The {program.name} program at{" "}
                {program.department?.university?.name || "the university"}
                offers a comprehensive curriculum designed to prepare students
                for successful careers in their chosen field. This program
                provides students with the theoretical knowledge and practical
                skills needed to excel in today's competitive job market.
              </p>
            </div>

            {/* Requirements Section */}
            {program.requirements && program.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Admission Requirements
                </h2>
                <div className="space-y-4">
                  {program.requirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {getRequirementIcon(requirement.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">
                          {getRequirementTypeLabel(requirement.type)}
                          {requirement.subject && ` - ${requirement.subject}`}
                        </h3>
                        {requirement.minGrade && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Minimum Grade:</strong>{" "}
                            {requirement.minGrade}
                          </p>
                        )}
                        {requirement.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {requirement.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Program Details Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Program Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Curriculum Structure
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Core foundation courses
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Specialized electives
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Practical workshops
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Final research project
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Learning Outcomes
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Mastery of core concepts
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Practical application skills
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Research capabilities
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Professional development
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Application Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    Application Status
                  </p>
                  <p className="text-gray-600">Open for 2024 intake</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Next Deadline</p>
                  <p className="text-gray-600">January 15, 2024</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Program Start</p>
                  <p className="text-gray-600">September 2024</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Study Mode</p>
                  <p className="text-gray-600">Full-time</p>
                </div>
              </div>
            </div>

            {/* Department Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Department Information
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Department:</strong> {program.department?.name}
                </p>
                <p>
                  <strong>Code:</strong> {program.department?.code}
                </p>
                <p>
                  <strong>University:</strong>{" "}
                  {program.department?.university?.name}
                </p>
                {/* Remove the Program count since it's not accessible in the serialized data */}
                <p>
                  <strong>Department of:</strong> {program.department?.name}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Program Advisor:</strong> Dr. Jane Smith
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {program.department?.code?.toLowerCase()}@
                  {program.department?.university?.name
                    ?.toLowerCase()
                    .replace(/\s+/g, "-")}
                  .edu
                </p>
                <p>
                  <strong>Phone:</strong> +1 (555) 987-6543
                </p>
                <p>
                  <strong>Office Hours:</strong> Mon-Fri, 9AM-5PM
                </p>
              </div>
            </div>

            {/* Application CTA */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">
                Ready to Apply?
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Start your application for the {program.name} program today.
              </p>
              <Link
                to={`/auth/login`}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:blue-700 transition-colors text-center block"
              >
                Start Application
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
