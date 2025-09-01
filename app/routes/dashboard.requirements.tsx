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
import { UserRole, RequirementType } from "@prisma/client";
import { toast } from "sonner";
import { BookOpenText, Edit, Trash, PlusCircle } from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import { getPrograms } from "@/services/program.service";
import {
  createProgramRequirement,
  getProgramRequirements,
  updateProgramRequirement,
  deleteProgramRequirement,
} from "@/services/requirement.service";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
}

interface ProgramRequirement {
  id: string;
  programId: string;
  program: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
      university?: {
        id: string;
        name: string;
      };
    } | null;
  };
  type: RequirementType;
  subject: string | null;
  minGrade: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
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

  if (
    user.role !== UserRole.DEPARTMENT_ADMINISTRATOR &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    throw redirect("/dashboard");
  }

  try {
    const universityId =
      user.role === UserRole.DEPARTMENT_ADMINISTRATOR
        ? user.university?.id
        : undefined;

    const departmentId =
      user.role === UserRole.DEPARTMENT_ADMINISTRATOR
        ? user.department?.id
        : undefined;

    // Get requirements
    const requirements = await getProgramRequirements(
      { ...user, role: user.role as UserRole },
      {
        includeProgram: true,
        includeDepartment: true,
        includeUniversity: true,
        universityId,
        departmentId,
      }
    );

    // Get programs for dropdown (filtered by user permissions)
    const programs = await getPrograms(
      { ...user, role: user.role as UserRole },
      {
        universityId,
        departmentId,
      }
    );

    return {
      requirements: requirements.map((requirement) => ({
        ...requirement,
        createdAt: requirement.createdAt.toISOString(),
        updatedAt: requirement.updatedAt.toISOString(),
      })),
      programs: programs.map((program) => ({
        id: program.id,
        name: program.name,
      })),
      currentUser: user,
    };
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load requirements",
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

  if (!user) {
    throw redirect("/auth/login");
  }

  const formData = await request.formData();
  const actionType = formData.get("_action");

  try {
    if (!actionType || typeof actionType !== "string") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    switch (actionType) {
      case "create": {
        const requirementData = {
          programId: formData.get("programId") as string,
          type: formData.get("type") as RequirementType,
          subject: formData.get("subject") as string,
          minGrade: formData.get("minGrade") as string,
          description: formData.get("description") as string,
        };

        const requirement = await createProgramRequirement(requirementData, {
          ...user,
          role: user.role as UserRole,
        });
        return {
          success: true,
          message: "Requirement created successfully",
          requirement,
        };
      }

      case "update": {
        const id = formData.get("id") as string;
        const requirementData = {
          type: formData.get("type") as RequirementType,
          subject: formData.get("subject") as string,
          minGrade: formData.get("minGrade") as string,
          description: formData.get("description") as string,
        };

        const requirement = await updateProgramRequirement(
          id,
          requirementData,
          {
            ...user,
            role: user.role as UserRole,
          }
        );
        return {
          success: true,
          message: "Requirement updated successfully",
          requirement,
        };
      }

      case "delete": {
        const id = formData.get("id") as string;
        await deleteProgramRequirement(id, {
          ...user,
          role: user.role as UserRole,
        });
        return {
          success: true,
          message: "Requirement deleted successfully",
        };
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Operation failed",
      status: 400,
    };
  }
}

export default function RequirementManagement() {
  const { requirements, programs, currentUser } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<string | null>(
    null
  );
  const [currentRequirement, setCurrentRequirement] =
    useState<Partial<ProgramRequirement> | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openEditModal = (requirement: ProgramRequirement) => {
    setCurrentRequirement(requirement);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentRequirement({
      programId: programs.length > 0 ? programs[0].id : "",
      type: RequirementType.GRADE as RequirementType,
      subject: "",
      minGrade: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setRequirementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRequirement(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRequirementToDelete(null);
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
      id: "program",
      cell: (info: { row: { original: ProgramRequirement } }) =>
        info.row.original.program.name,
      header: () => (
        <span className="flex items-center">
          <BookOpenText className="me-2" size={16} /> Program
        </span>
      ),
    },
    {
      id: "type",
      cell: (info: { row: { original: ProgramRequirement } }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
          {info.row.original.type.toLowerCase()}
        </span>
      ),
      header: "Type",
    },
    {
      id: "subject",
      cell: (info: { row: { original: ProgramRequirement } }) =>
        info.row.original.subject || "N/A",
      header: "Subject",
    },
    {
      id: "minGrade",
      cell: (info: { row: { original: ProgramRequirement } }) =>
        info.row.original.minGrade || "N/A",
      header: "Minimum Grade",
    },
    {
      id: "description",
      cell: (info: { row: { original: ProgramRequirement } }) => (
        <div
          className="max-w-xs truncate"
          title={info.row.original.description}
        >
          {info.row.original.description}
        </div>
      ),
      header: "Description",
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: ProgramRequirement } }) => (
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
            Program Requirement Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage admission requirements for academic programs
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          <button
            onClick={openCreateModal}
            className="bg-green-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
          >
            <PlusCircle className="mr-2" size={18} />
            Add Requirement
          </button>
        </div>
      </div>

      <GenericTable data={requirements} columns={columns} />

      {/* Create/Edit Modal */}
      {isModalOpen && currentRequirement && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentRequirement.id
                  ? "Edit Requirement"
                  : "Create New Requirement"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentRequirement.id ? "update" : "create"}
                />
                {currentRequirement.id && (
                  <input
                    type="hidden"
                    name="id"
                    value={currentRequirement.id}
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program
                    </label>
                    <select
                      name="programId"
                      defaultValue={currentRequirement.programId}
                      required
                      disabled={!!currentRequirement.id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      {programs.map((program: any) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirement Type
                    </label>
                    <select
                      name="type"
                      defaultValue={currentRequirement.type}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.values(RequirementType).map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject (if applicable)
                    </label>
                    <input
                      type="text"
                      name="subject"
                      defaultValue={currentRequirement.subject || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Grade (if applicable)
                    </label>
                    <input
                      type="text"
                      name="minGrade"
                      defaultValue={currentRequirement.minGrade || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={currentRequirement.description}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                      {currentRequirement.id ? "Update" : "Create"}
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
                Are you sure you want to delete this requirement? This action
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
                    value={requirementToDelete || ""}
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
