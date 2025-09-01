import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useSearchParams,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { UserRole } from "@prisma/client";
import {
  createApplication,
  submitApplication,
  canStudentApply,
} from "@/services/application.service";
import {
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  getProgramMatches,
  ProgramMatch,
} from "@/services/program-matching.service";
import { toast } from "sonner";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
  currentPage?: string;
  reasons?: string[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Loader started");
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    console.log("No user found, redirecting to login");
    if (refreshToken) {
      throw redirect("/auth/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
    throw redirect("/auth/login");
  }

  // Only students can access this page
  if (user.role !== UserRole.STUDENT) {
    console.log("User is not a student, redirecting to dashboard");
    throw redirect("/dashboard");
  }

  try {
    console.log("Fetching program matches for user:", user.id);
    const programMatches = await getProgramMatches({
      ...user,
      role: user.role as UserRole,
    });

    console.log("Program matches fetched:", programMatches.length);
    return json({
      programMatches,
      currentUser: user,
    });
  } catch (error) {
    console.error("Loader error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load program matches",
        programMatches: [],
        currentUser: user,
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("Action started");
  try {
    const session = await getSession(request.headers.get("Cookie"));
    const refreshToken = session.get("refreshToken");
    const user = await getUserBySession(refreshToken);

    if (!user) {
      console.log("No user in action, redirecting to login");
      if (refreshToken) {
        throw redirect("/auth/login", {
          headers: {
            "Set-Cookie": await destroySession(session),
          },
        });
      }
      throw redirect("/auth/login");
    }

    if (user.role !== UserRole.STUDENT) {
      console.log("Non-student tried to submit application");
      return json(
        { error: "Only students can submit applications" },
        { status: 403 }
      );
    }

    if (!user.id) {
      console.log("User ID missing in action");
      return json({ error: "User ID is required" }, { status: 400 });
    }

    const formData = await request.formData();
    const programId = formData.get("programId") as string;
    const currentPage = formData.get("currentPage") as string;

    console.log("Form data:", {
      programId,
      currentPage,
      hasProgramId: !!programId,
    });

    if (!programId) {
      console.log("Program ID missing in form data");
      return json({ error: "Program ID is required" }, { status: 400 });
    }

    console.log(
      "Checking eligibility for user:",
      user.id,
      "program:",
      programId
    );
    const eligibility = await canStudentApply(user?.id, programId);
    console.log("Eligibility result:", eligibility);

    if (!eligibility.canApply) {
      console.log("User not eligible to apply:", eligibility.reasons);
      return json(
        {
          error: "Not eligible to apply",
          reasons: eligibility.reasons || [],
        },
        { status: 400 }
      );
    }

    const applicationInput = {
      userId: user.id,
      programId: programId,
    };

    console.log("Creating application with input:", applicationInput);
    const application = await createApplication(applicationInput, {
      ...user,
      role: user.role as UserRole,
    });
    console.log("Application created:", application.id);

    console.log("Submitting application:", application.id);
    const submittedApplication = await submitApplication(application.id, {
      ...user,
      role: user.role as UserRole,
    });
    console.log("Application submitted successfully:", submittedApplication.id);

    return json({
      success: true,
      applicationId: submittedApplication.id,
      message: "Application submitted successfully!",
      currentPage: currentPage || "1",
    });
  } catch (error) {
    console.error("Action error:", error);

    if (error instanceof Response) {
      console.log("Response error caught, rethrowing");
      throw error;
    }

    if (error instanceof Error) {
      console.log("Error instance:", error.message);
      if (error.message.includes("Unauthorized")) {
        return json({ error: "Unauthorized access" }, { status: 401 });
      }
      if (error.message.includes("not found")) {
        return json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return json({ error: error.message }, { status: 409 });
      }
      return json({ error: error.message }, { status: 500 });
    }

    return json({ error: "Failed to submit application" }, { status: 500 });
  }
}

export default function DashboardMatches() {
  const { programMatches, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  console.log("Component rendered", {
    programMatchesCount: programMatches.length,
    actionData,
    searchQuery,
  });

  // Remove the useEffect entirely and add this right after your actionData declaration
  if (actionData) {
    if (actionData.success && actionData.message) {
      toast.success(actionData.message);

      if (actionData.currentPage) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("page", actionData.currentPage);
        setSearchParams(newSearchParams);
      }
    } else if (actionData.error) {
      if (actionData.reasons && actionData.reasons.length > 0) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{actionData.error}</span>
            <ul className="list-disc list-inside mt-1 text-sm">
              {actionData.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        );
      } else {
        toast.error(actionData.error);
      }
    }
  }

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const currentPage = parseInt(searchParams.get("page") || "1") - 1;

  console.log("Navigation state:", navigation.state);
  console.log("Current page:", currentPage);

  const filteredPrograms = useMemo(() => {
    if (!searchQuery) return programMatches;

    const query = searchQuery.toLowerCase();
    return programMatches.filter(
      (program: ProgramMatch) =>
        program.programName.toLowerCase().includes(query) ||
        program.departmentName.toLowerCase().includes(query) ||
        program.universityName.toLowerCase().includes(query)
    );
  }, [programMatches, searchQuery]);

  const totalPrograms = filteredPrograms.length;
  const currentProgram = filteredPrograms[currentPage] || filteredPrograms[0];
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPrograms - 1;

  const goToPage = (page: number) => {
    console.log("Going to page:", page);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", (page + 1).toString());
    setSearchParams(newSearchParams);
  };

  const goToPrev = () => {
    if (canGoPrev) goToPage(currentPage - 1);
  };

  const goToNext = () => {
    if (canGoNext) goToPage(currentPage + 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    const newSearchParams = new URLSearchParams(searchParams);
    if (query) {
      newSearchParams.set("search", query);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1");
    setSearchParams(newSearchParams);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-gray-900">Program Matches</h2>
          <p className="text-gray-600 text-sm">
            See which programs match your qualifications
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search programs, departments, or universities..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {programMatches.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No program matches found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add more qualifications to see matching programs.
          </p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No programs match your search
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try searching for something else.
          </p>
        </div>
      ) : (
        <div>
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            {filteredPrograms.length} program
            {filteredPrograms.length !== 1 ? "s" : ""} found that matched your
            qualifications
            {searchQuery && ` for "${searchQuery}"`}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Showing {Math.min(currentPage + 1, totalPrograms)} of{" "}
              {totalPrograms} programs
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrev}
                disabled={!canGoPrev}
                className={`p-2 rounded-md ${
                  canGoPrev
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="text-sm font-medium">
                {Math.min(currentPage + 1, totalPrograms)} / {totalPrograms}
              </span>

              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className={`p-2 rounded-md ${
                  canGoNext
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Current Program Card */}
          {currentProgram && (
            <ProgramMatchCard
              key={currentProgram.programId}
              program={currentProgram}
              isApplying={isSubmitting}
              currentPage={currentPage}
            />
          )}

          {/* Mobile Pagination (at bottom) */}
          <div className="flex items-center justify-between mt-6 md:hidden">
            <button
              onClick={goToPrev}
              disabled={!canGoPrev}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                canGoPrev
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              {Math.min(currentPage + 1, totalPrograms)} of {totalPrograms}
            </span>

            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                canGoNext
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementItem({ requirement }: { requirement: any }) {
  const getStatusIcon = () => {
    switch (requirement.status) {
      case "met":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (requirement.status) {
      case "met":
        return "Met";
      case "partial":
        return "Partially Met";
      default:
        return "Not Met";
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
      {getStatusIcon()}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {requirement.type}
            {requirement.subject && ` - ${requirement.subject}`}
          </span>
          <span
            className={`text-xs font-medium ${
              requirement.status === "met"
                ? "text-green-600"
                : requirement.status === "partial"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {getStatusText()}
          </span>
        </div>

        {requirement.minGrade && (
          <p className="text-xs text-gray-500">
            Minimum grade required: {requirement.minGrade}
          </p>
        )}

        {requirement.matchingQualifications &&
          requirement.matchingQualifications.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-700">
                Matching qualifications:
              </p>
              {requirement.matchingQualifications.map((qual: any) => (
                <div
                  key={qual.qualificationId}
                  className="text-xs text-gray-600 bg-white p-2 rounded border"
                >
                  <span className="font-medium">{qual.subject}</span>:{" "}
                  {qual.grade}
                  {!qual.verified && (
                    <span className="ml-2 text-yellow-600">
                      (Pending verification)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function ProgramMatchCard({
  program,
  isApplying,
  currentPage,
}: {
  program: ProgramMatch;
  isApplying: boolean;
  currentPage: number;
}) {
  console.log(
    "Program card rendered:",
    program.programId,
    "isApplying:",
    isApplying
  );

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {program.programName}
          </h3>
          <p className="text-sm text-gray-600">
            {program.departmentName} • {program.universityName}
          </p>
        </div>

        <div className="mt-2 md:mt-0">
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
              <div
                className={`h-2.5 rounded-full ${
                  program.matchScore >= 80
                    ? "bg-green-500"
                    : program.matchScore >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${program.matchScore}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {program.matchScore}% Match
            </span>
          </div>
          <p className="text-xs text-gray-500 text-right">
            {program.metRequirements} of {program.totalRequirements}{" "}
            requirements met
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Requirements:</h4>
        {program.requirements.map((requirement) => (
          <RequirementItem
            key={requirement.requirementId}
            requirement={requirement}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        {/* Use a regular form with method="post" */}
        <form method="post">
          <input type="hidden" name="programId" value={program.programId} />
          <input
            type="hidden"
            name="currentPage"
            value={currentPage.toString()}
          />
          <button
            type="submit"
            disabled={program.matchScore < 50 || isApplying}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
              program.matchScore >= 80
                ? "bg-green-600 text-white hover:bg-green-700"
                : program.matchScore >= 50
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-700"
            } ${isApplying ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : program.matchScore >= 80 ? (
              "Apply Now"
            ) : program.matchScore >= 50 ? (
              "Apply Anyway"
            ) : (
              "Not Eligible"
            )}
          </button>
        </form>

        {program.matchScore < 80 && program.matchScore >= 50 && (
          <p className="text-xs text-yellow-600 mt-2 text-center">
            This program is a partial match. You can still apply, but may need
            to complete additional requirements.
          </p>
        )}
      </div>
    </div>
  );
}
