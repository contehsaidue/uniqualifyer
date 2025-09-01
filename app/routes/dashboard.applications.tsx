import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useSearchParams,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { toast } from "sonner";
import {
  FileText,
  Trash,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
  BookOpen,
  Send,
} from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import {
  getApplicationsByStudentId,
  withdrawApplication,
  submitApplication,
} from "~/services/application.service";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
  application?: any;
}

interface Application {
  id: string;
  studentId: string;
  programId: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    name: string;
    department: {
      name: string;
      university: {
        name: string;
      };
    };
  };
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

  if (user.role !== UserRole.STUDENT) {
    console.log("User is not a student, redirecting to dashboard");
    throw redirect("/dashboard");
  }

  try {
    console.log("Fetching existing applications for user:", user.id);
    const existingApplications = await getApplicationsByStudentId(
      user.id,
      {
        ...user,
        role: user.role as UserRole,
      },
      {
        status: [
          ApplicationStatus.PENDING,
          ApplicationStatus.DRAFT,
          ApplicationStatus.APPROVED,
          ApplicationStatus.CONDITIONAL,
          ApplicationStatus.REJECTED,
          ApplicationStatus.UNDER_REVIEW,
        ],
      }
    );

    console.log(
      "Existing applications:",
      existingApplications.applications.length
    );

    return {
      existingApplications: existingApplications.applications,
      currentUser: user,
    };
  } catch (error) {
    console.error("Loader error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to load programs",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (user?.role !== UserRole.STUDENT) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  try {
    if (!actionType || typeof actionType !== "string") {
      return { error: "Invalid action" };
    }

    switch (actionType) {
      case "withdraw": {
        const id = formData.get("id") as string;
        if (!id) {
          return { error: "Missing application ID" };
        }

        await withdrawApplication(id, { ...user, role: user.role as UserRole });

        return {
          success: true,
          message: "Application withdrawn successfully",
        };
      }

      case "submit": {
        const id = formData.get("id") as string;
        if (!id) {
          return { error: "Missing application ID" };
        }

        await submitApplication(id, { ...user, role: user.role as UserRole });

        return {
          success: true,
          message: "Application submitted successfully",
        };
      }

      default:
        return { error: "Invalid action" };
    }
  } catch (error) {
    console.error("Action error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Operation failed",
      status: 400,
    };
  }
}

export default function StudentApplicationManagement() {
  const { existingApplications } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false); // Added submit modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(
    null
  );
  const [applicationToSubmit, setApplicationToSubmit] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
      window.location.reload();
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openDeleteModal = (id: string) => {
    setApplicationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setApplicationToDelete(null);
  };

  const openSubmitModal = (id: string) => {
    setApplicationToSubmit(id);
    setIsSubmitModalOpen(true);
  };

  const closeSubmitModal = () => {
    setIsSubmitModalOpen(false);
    setApplicationToSubmit(null);
  };

  const openDetailsModal = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedApplication(null);
  };

  // Filter applications
  const filteredApplications = existingApplications.filter((app: any) => {
    const matchesSearch = searchQuery
      ? app.program?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.program?.department?.university?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true;

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const newSearchParams = new URLSearchParams(searchParams);
    if (query) {
      newSearchParams.set("search", query);
    } else {
      newSearchParams.delete("search");
    }
    setSearchParams(newSearchParams);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    const newSearchParams = new URLSearchParams(searchParams);
    if (status !== "all") {
      newSearchParams.set("status", status);
    } else {
      newSearchParams.delete("status");
    }
    setSearchParams(newSearchParams);
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case ApplicationStatus.UNDER_REVIEW:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case ApplicationStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case ApplicationStatus.DRAFT:
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusText = status.replace("_", " ").toLowerCase();
    const formattedText =
      statusText.charAt(0).toUpperCase() + statusText.slice(1);

    let bgColor = "";
    switch (status) {
      case ApplicationStatus.PENDING:
        bgColor = "bg-yellow-100 text-yellow-800";
        break;
      case ApplicationStatus.UNDER_REVIEW:
        bgColor = "bg-blue-100 text-blue-800";
        break;
      case ApplicationStatus.APPROVED:
        bgColor = "bg-green-100 text-green-800";
        break;
      case ApplicationStatus.REJECTED:
        bgColor = "bg-red-100 text-red-800";
        break;
      case ApplicationStatus.DRAFT:
        bgColor = "bg-gray-100 text-gray-800";
        break;
      default:
        bgColor = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}
      >
        {getStatusIcon(status)}
        <span className="ml-1">{formattedText}</span>
      </span>
    );
  };

  const columns = [
    {
      accessorKey: "index",
      header: () => <span className="flex justify-center">SN</span>,
      cell: ({ row }: { row: { index: number } }) => row.index + 1,
    },
    {
      id: "program",
      cell: (info: { row: { original: Application } }) => (
        <div>
          <div className="font-medium text-gray-900">
            {info.row.original.program?.name || "Unknown Program"}
          </div>
          <div className="text-sm text-gray-500">
            {info.row.original.program?.department?.university?.name ||
              "Unknown University"}
          </div>
        </div>
      ),
      header: "Program & University",
    },
    {
      id: "submitted",
      cell: (info: { row: { original: Application } }) => (
        <div className="text-sm text-gray-900">
          {info.row.original.submittedAt
            ? new Date(info.row.original.submittedAt).toLocaleDateString()
            : "Not submitted"}
        </div>
      ),
      header: "Submitted On",
    },
    {
      id: "status",
      cell: (info: { row: { original: Application } }) =>
        getStatusBadge(info.row.original.status),
      header: "Status",
    },

    {
      id: "actions",
      cell: ({ row }: { row: { original: Application } }) => (
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => openDetailsModal(row.original)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="View Details"
          >
            <FileText size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">View</span>
          </button>

          {row.original.status === ApplicationStatus.PENDING && (
            <button
              onClick={() => openDeleteModal(row.original.id)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center rounded"
              aria-label="Withdraw"
            >
              <Trash size={16} />
              <span className="sr-only sm:not-sr-only sm:ml-2">Withdraw</span>
            </button>
          )}

          {row.original.status === ApplicationStatus.DRAFT && (
            <button
              onClick={() => openSubmitModal(row.original.id)}
              className="p-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center rounded"
              aria-label="Submit"
            >
              <Send size={16} />
              <span className="sr-only sm:not-sr-only sm:ml-2">Submit</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-600 text-sm">
            Manage your program applications and track their status
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          <a
            href="/dashboard/matches"
            className="bg-green-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
          >
            <PlusCircle className="mr-2" size={18} />
            Apply to Program
          </a>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search programs or universities..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            {Object.values(ApplicationStatus).map((status) => (
              <option key={status} value={status}>
                {status
                  .replace("_", " ")
                  .toLowerCase()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {existingApplications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No applications yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by applying to a program.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard/matches"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              Browse Programs
            </a>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No applications match your search
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <GenericTable data={filteredApplications} columns={columns} />
      )}

      {/* Application Details Modal */}
      {isDetailsModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Program</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedApplication.program?.name || "Unknown Program"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Building className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      University
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedApplication.program?.department?.university
                        ?.name || "Unknown University"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Submitted On
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedApplication.submittedAt
                        ? new Date(
                            selectedApplication.submittedAt
                          ).toLocaleDateString()
                        : "Not submitted"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeDetailsModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedApplication.status === ApplicationStatus.PENDING && (
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      openDeleteModal(selectedApplication.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Withdraw Application
                  </button>
                )}
                {selectedApplication.status === ApplicationStatus.DRAFT && (
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      openSubmitModal(selectedApplication.id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Submit Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Withdraw Application</h2>
              <p className="mb-6">
                Are you sure you want to withdraw this application? This action
                cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <Form method="post" onSubmit={closeDeleteModal}>
                  <input type="hidden" name="_action" value="withdraw" />
                  <input
                    type="hidden"
                    name="id"
                    value={applicationToDelete || ""}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Withdraw Application
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Submit Application</h2>
              <p className="mb-6">
                Are you sure you want to submit this application? Once
                submitted, you won't be able to make changes to it.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <Form method="post" onSubmit={closeSubmitModal}>
                  <input type="hidden" name="_action" value="submit" />
                  <input
                    type="hidden"
                    name="id"
                    value={applicationToSubmit || ""}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Submit Application
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
