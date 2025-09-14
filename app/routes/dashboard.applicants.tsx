import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { ApplicationStatus, RequirementType, UserRole } from "@prisma/client";
import { toast } from "sonner";
import { Search, Filter, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import {
  getApplicationsForDepartmentAdmin,
  updateApplicationStatus,
  getApplicationDetails,
} from "@/services/application.service";

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
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  student: {
    user: {
      name: string;
      email: string;
    };
    qualifications: Array<{
      type: string;
      subject: string;
      grade: string;
      verified: boolean;
    }>;
  };
  program: {
    name: string;
    department: {
      name: string;
      university: {
        name: string;
      };
    };
    requirements: Array<{
      type: RequirementType;
      subject: string;
      minGrade: string;
      description: string;
    }>;
  };
  notes: Array<{
    id: string;
    content: string;
    internalOnly: boolean;
    createdAt: string;
    author: {
      name: string;
      role: UserRole;
    };
  }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    if (refreshToken) {
      throw redirect("/auth/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
    throw redirect("/auth/login");
  }

  if (user.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw redirect("/dashboard");
  }

  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get(
      "status"
    ) as ApplicationStatus | null;
    const searchQuery = url.searchParams.get("search") || "";

    const applications = await getApplicationsForDepartmentAdmin(
      {
        ...user,
        role: user.role as UserRole,
      },
      statusFilter,
      searchQuery
    );

    return {
      applications: applications.map((application: any) => ({
        ...application,
        submittedAt: application.submittedAt?.toISOString() || null,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      })),
      currentUser: user,
      statusFilter,
      searchQuery,
    };
  } catch (error) {
    console.error("Loader error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load applications",
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

  if (user?.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  try {
    if (!actionType || typeof actionType !== "string") {
      return { error: "Invalid action" };
    }

    switch (actionType) {
      case "updateStatus": {
        const applicationId = formData.get("applicationId") as string;
        const status = formData.get("status") as ApplicationStatus;
        const noteContent = formData.get("note") as string;

        if (!applicationId || !status) {
          return { error: "Missing required fields" };
        }

        const application = await updateApplicationStatus(
          applicationId,
          status,
          { ...user, role: user.role as UserRole },
          noteContent || undefined
        );

        return {
          success: true,
          message: "Application status updated successfully",
          application: {
            ...application,
            submittedAt: application.submittedAt?.toISOString() || null,
            createdAt: application.createdAt.toISOString(),
            updatedAt: application.updatedAt.toISOString(),
          },
        };
      }

      case "getDetails": {
        const applicationId = formData.get("applicationId") as string;

        if (!applicationId) {
          return { error: "Missing application ID" };
        }

        const application = await getApplicationDetails(applicationId, {
          ...user,
          role: user.role as UserRole,
        });

        return {
          success: true,
          application: {
            ...application,
            submittedAt: application.submittedAt?.toISOString() || null,
            createdAt: application.createdAt.toISOString(),
            updatedAt: application.updatedAt.toISOString(),
          },
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

export default function DepartmentAdminApplicationManagement() {
  const { applications, statusFilter, searchQuery } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentApplication, setCurrentApplication] =
    useState<Application | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    ApplicationStatus.PENDING
  );
  const [note, setNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const submit = useSubmit();

  // For getDetails action only
  useEffect(() => {
    if (
      actionData?.success &&
      actionData.application &&
      navigation.formData?.get("_action") === "getDetails"
    ) {
      setCurrentApplication(actionData.application);
      setIsDetailsModalOpen(true);
    }
  }, [actionData, navigation.formData]);

  // For updateStatus action only
  useEffect(() => {
    if (
      actionData?.success &&
      navigation.formData?.get("_action") === "updateStatus"
    ) {
      toast.success(actionData.message);
      if (isStatusModalOpen) {
        setIsStatusModalOpen(false);
      }
    }
  }, [actionData]);

  // For errors
  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openDetailsModal = async (applicationId: string) => {
    const formData = new FormData();
    formData.append("_action", "getDetails");
    formData.append("applicationId", applicationId);

    submit(formData, { method: "post" });
  };

  const openStatusModal = (
    application: Application,
    status: ApplicationStatus
  ) => {
    setCurrentApplication(application);
    setSelectedStatus(status);
    setNote("");
    setIsStatusModalOpen(true);
  };

  const closeModals = () => {
    setIsDetailsModalOpen(false);
    setIsStatusModalOpen(false);
    setCurrentApplication(null);
  };

  const handleStatusUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("_action", "updateStatus");
    formData.append("applicationId", currentApplication?.id || "");
    formData.append("status", selectedStatus);

    submit(formData, { method: "post" });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const status = formData.get("status") as ApplicationStatus;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    window.location.href = `${window.location.pathname}?${params.toString()}`;
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case ApplicationStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case ApplicationStatus.UNDER_REVIEW:
        return "bg-blue-100 text-blue-800";
      case ApplicationStatus.CONDITIONAL:
        return "bg-yellow-100 text-yellow-800";
      case ApplicationStatus.PENDING:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return <CheckCircle size={16} />;
      case ApplicationStatus.REJECTED:
        return <XCircle size={16} />;
      case ApplicationStatus.UNDER_REVIEW:
      case ApplicationStatus.CONDITIONAL:
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    application: Application
  ) => {
    const status = e.target.value as ApplicationStatus;
    if (status) {
      openStatusModal(application, status);
      // Reset the select value
      e.target.value = "";
    }
  };

  const statusOptions = [
    { value: ApplicationStatus.UNDER_REVIEW, label: "Under Review" },
    { value: ApplicationStatus.CONDITIONAL, label: "Conditional" },
    { value: ApplicationStatus.APPROVED, label: "Approve" },
    { value: ApplicationStatus.REJECTED, label: "Reject" },
  ];

  const columns = [
    {
      accessorKey: "index",
      header: () => <span className="flex justify-center">SN</span>,
      cell: ({ row }: { row: { index: number } }) => row.index + 1,
    },
    {
      id: "student",
      cell: (info: { row: { original: Application } }) => (
        <div>
          <div className="font-medium">
            {info.row.original.student.user.name}
          </div>
          <div className="text-sm text-gray-500">
            {info.row.original.student.user.email}
          </div>
        </div>
      ),
      header: "Student",
    },
    {
      id: "program",
      cell: (info: { row: { original: Application } }) => (
        <div>
          <div className="font-medium">{info.row.original.program.name}</div>
          <div className="text-sm text-gray-500">
            {info.row.original.program.department.university.name}
          </div>
        </div>
      ),
      header: "Program & University",
    },
    {
      id: "submittedAt",
      cell: (info: { row: { original: Application } }) => (
        <div>
          {info.row.original.submittedAt
            ? new Date(info.row.original.submittedAt).toLocaleDateString()
            : "Not submitted"}
        </div>
      ),
      header: "Submitted",
    },
    {
      id: "status",
      cell: (info: { row: { original: Application } }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            info.row.original.status
          )}`}
        >
          {getStatusIcon(info.row.original.status)}
          <span className="ml-1 capitalize">
            {info.row.original.status.toLowerCase().replace("_", " ")}
          </span>
        </span>
      ),
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Application } }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openDetailsModal(row.original.id)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="View Details"
          >
            <Eye size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">View</span>
          </button>

          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 max-w-full"
            defaultValue=""
            onChange={(e) => handleStatusChange(e, row.original)}
            disabled={isUpdatingStatus}
          >
            <option value="">Update Status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900">
            Application Management
          </h2>
          <p className="text-gray-600 text-sm">
            Review and manage student applications for your department
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <Form
          method="get"
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="w-full md:w-48">
            <label htmlFor="status" className="sr-only">
              Filter by status
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="status"
                id="status"
                defaultValue={statusFilter || ""}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.values(ApplicationStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) +
                      status.slice(1).toLowerCase().replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </Form>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No applications found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter
              ? "Try adjusting your search or filter criteria."
              : "There are no applications to review at this time."}
          </p>
        </div>
      ) : (
        <GenericTable data={applications} columns={columns} />
      )}

      {/* Application Details Modal */}
      {isDetailsModalOpen && currentApplication && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Application Details</h2>

              <div className="space-y-6">
                {/* Program Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Program Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">
                      {currentApplication.program.name}
                    </p>
                    <p className="text-gray-600">
                      {currentApplication.program.department.name} -{" "}
                      {currentApplication.program.department.university.name}
                    </p>

                    {/* Program Requirements */}
                    {currentApplication.program.requirements &&
                      currentApplication.program.requirements.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Requirements:
                          </h4>
                          <ul className="space-y-2">
                            {currentApplication.program.requirements.map(
                              (requirement, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-600"
                                >
                                  •
                                  {requirement.subject &&
                                    ` ${requirement.subject} - Minimum grade required : ${requirement.minGrade}`}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Student Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">
                      {currentApplication.student.user.name}
                    </p>
                    <p className="text-gray-600">
                      {currentApplication.student.user.email}
                    </p>
                  </div>
                </div>
                {/*Result */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Result
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {currentApplication.student.qualifications.length > 0 ? (
                      <div className="space-y-3">
                        {currentApplication.student.qualifications.map(
                          (qual: any, index: number) => (
                            <div
                              key={index}
                              className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                            >
                              <p>
                                {qual.subject} - {qual.grade}
                              </p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  qual.verified
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {qual.verified
                                  ? "Verified"
                                  : "Pending Verification"}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No qualifications added.</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {currentApplication.notes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Notes
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-3">
                      {currentApplication.notes.map((note: any) => (
                        <div
                          key={note.id}
                          className="border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                        >
                          <p className="text-sm text-gray-700">
                            {note.content}
                          </p>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>
                              By {note.author.name} ({note.author.role})
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal - Fixed to appear properly */}
      {isStatusModalOpen && currentApplication && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Update Application Status
              </h2>

              <div className="space-y-6">
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Student Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">
                      {currentApplication.student.user.name}
                    </p>
                    <p className="text-gray-600">
                      {currentApplication.student.user.email}
                    </p>
                  </div>
                </div>

                {/* Program Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Program Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">
                      {currentApplication.program.name}
                    </p>
                    <p className="text-gray-600">
                      {currentApplication.program.department.name} -
                      {currentApplication.program.department.university.name}
                    </p>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Current Status
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        currentApplication.status
                      )}`}
                    >
                      {getStatusIcon(currentApplication.status)}
                      <span className="ml-1 capitalize">
                        {currentApplication.status
                          .toLowerCase()
                          .replace("_", " ")}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Status Update Form */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Update Status
                  </h3>
                  <Form method="post" onSubmit={handleStatusUpdate}>
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(ApplicationStatus).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setSelectedStatus(status)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                selectedStatus === status
                                  ? getStatusColor(status) +
                                    " ring-2 ring-offset-2 ring-blue-500"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className="ml-1 capitalize">
                                {status.toLowerCase().replace("_", " ")}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Add Note (Optional)
                        </label>
                        <textarea
                          name="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add any notes about this status change..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={closeModals}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={navigation.state === "submitting"}
                        >
                          {navigation.state === "submitting"
                            ? "Updating..."
                            : "Update Status"}
                        </button>
                      </div>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
