import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useSubmit,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { QualificationType, UserRole } from "@prisma/client";
import { toast } from "sonner";
import { BookOpenText, Edit, Trash, PlusCircle, User } from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import {
  getQualifications,
  createQualification,
  updateQualification,
  deleteQualification,
} from "@/services/qualification.service";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
  qualification?: any;
}

interface Qualification {
  id: string;
  studentId: string;
  type: QualificationType;
  subject: string;
  grade: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  student?: {
    user: {
      name: string;
      email: string;
    };
  };
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

  // Only students can access this page
  if (user.role !== UserRole.STUDENT) {
    throw redirect("/dashboard");
  }

  try {
    const qualifications = await getQualifications({
      ...user,
      role: user.role as UserRole,
    });

    return {
      qualifications: qualifications.map((qualification) => ({
        ...qualification,
        createdAt: qualification.createdAt.toISOString(),
        updatedAt: qualification.updatedAt.toISOString(),
      })),
      currentUser: user,
    };
  } catch (error) {
    console.error("Loader error:", error);

    if (error instanceof Response) {
      throw error;
    }

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
  console.log("User in action:", user);
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
      case "create": {
        const qualificationData = {
          type: formData.get("type") as QualificationType,
          subject: formData.get("subject") as string,
          grade: formData.get("grade") as string,
        };

        // Validate required fields
        if (
          !qualificationData.type ||
          !qualificationData.subject ||
          !qualificationData.grade
        ) {
          return { error: "Missing required fields" };
        }

        const qualification = await createQualification(qualificationData, {
          ...user,
          role: user.role as UserRole,
        });

        return {
          success: true,
          message: "Qualification added successfully",
          qualification: {
            ...qualification,
            createdAt: qualification.createdAt.toISOString(),
            updatedAt: qualification.updatedAt.toISOString(),
          },
        };
      }

      case "update": {
        const id = formData.get("id") as string;
        if (!id) {
          return { error: "Missing qualification ID" };
        }

        const qualificationData = {
          type: formData.get("type") as QualificationType,
          subject: formData.get("subject") as string,
          grade: formData.get("grade") as string,
        };

        // Validate at least one field is provided
        if (
          !qualificationData.type &&
          !qualificationData.subject &&
          !qualificationData.grade
        ) {
          return { error: "No fields to update" };
        }

        const qualification = await updateQualification(id, qualificationData, {
          ...user,
          role: user.role as UserRole,
        });

        return {
          success: true,
          message: "Qualification updated successfully",
          qualification: {
            ...qualification,
            createdAt: qualification.createdAt.toISOString(),
            updatedAt: qualification.updatedAt.toISOString(),
          },
        };
      }

      case "delete": {
        const id = formData.get("id") as string;
        if (!id) {
          return { error: "Missing qualification ID" };
        }

        await deleteQualification(id, { ...user, role: user.role as UserRole });

        return {
          success: true,
          message: "Qualification deleted successfully",
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

export default function StudentQualificationManagement() {
  const { qualifications } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState<
    string | null
  >(null);
  const [currentQualification, setCurrentQualification] =
    useState<Partial<Qualification> | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openEditModal = (qualification: Qualification) => {
    setCurrentQualification(qualification);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentQualification({
      type: QualificationType.HIGH_SCHOOL,
      subject: "",
      grade: "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setQualificationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentQualification(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setQualificationToDelete(null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeModal();
    submit(e.currentTarget, { method: "post", replace: true });
  };

  const columns = [
    {
      accessorKey: "index",
      header: () => <span className="flex justify-center">SN</span>,
      cell: ({ row }: { row: { index: number } }) => row.index + 1,
    },
    {
      id: "type",
      cell: (info: { row: { original: Qualification } }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
          {info.row.original.type.toLowerCase().replace("_", " ")}
        </span>
      ),
      header: "Type",
    },
    {
      id: "subject",
      cell: (info: { row: { original: Qualification } }) =>
        info.row.original.subject,
      header: "Subject",
    },
    {
      id: "grade",
      cell: (info: { row: { original: Qualification } }) =>
        info.row.original.grade,
      header: "Grade",
    },
    {
      id: "verified",
      cell: (info: { row: { original: Qualification } }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            info.row.original.verified
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {info.row.original.verified ? "Verified" : "Pending"}
        </span>
      ),
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Qualification } }) => (
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="Edit"
          >
            <Edit size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">Edit</span>
          </button>

          <button
            onClick={() => openDeleteModal(row.original.id)}
            className="p-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="Delete"
          >
            <Trash size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900">
            My Uploaded Result
          </h2>
          <p className="text-gray-600 text-sm">
            Manage your academic results for applications
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          <button
            onClick={openCreateModal}
            className="bg-green-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
          >
            <PlusCircle className="mr-2" size={18} />
            Add Result
          </button>
        </div>
      </div>

      {qualifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <BookOpenText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No result</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first result.
          </p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              Add Result
            </button>
          </div>
        </div>
      ) : (
        <GenericTable data={qualifications} columns={columns} />
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && currentQualification && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentQualification.id ? "Edit Result" : "Add New Result"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentQualification.id ? "update" : "create"}
                />
                {currentQualification.id && (
                  <input
                    type="hidden"
                    name="id"
                    value={currentQualification.id}
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Result Type
                    </label>
                    <select
                      name="type"
                      defaultValue={currentQualification.type}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(QualificationType).map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0) +
                            type.slice(1).toLowerCase().replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      defaultValue={currentQualification.subject || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics, English, Physics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade/Score
                    </label>
                    <input
                      type="text"
                      name="grade"
                      defaultValue={currentQualification.grade || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., A1, B2, C4"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> After adding a qualification, you
                      may need to upload supporting documents through the
                      Documents section. Administrators will verify your
                      qualifications.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currentQualification.id ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
              <p className="mb-6">
                Are you sure you want to delete this qualification? This action
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
                  <input type="hidden" name="_action" value="delete" />
                  <input
                    type="hidden"
                    name="id"
                    value={qualificationToDelete || ""}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
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
