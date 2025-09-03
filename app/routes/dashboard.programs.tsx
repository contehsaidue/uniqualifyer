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
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import {
  BookOpenText,
  Edit,
  Trash,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Building,
  GraduationCap,
} from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import {
  createProgram,
  getPrograms,
  updateProgram,
  deleteProgram,
} from "@/services/program.service";
import { useRevalidator } from "@remix-run/react";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
}

interface Program {
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
  requirements: {
    id: string;
    type: string;
    subject: string | null;
    minGrade: string | null;
    description: string;
  }[];
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

    const programs = await getPrograms(
      { ...user, role: user.role as UserRole },
      {
        includeDepartment: true,
        includeUniversity: true,
        includeRequirements: true,
        universityId,
        departmentId,
      }
    );

    return {
      programs: programs.map((program) => ({
        ...program,
        createdAt: program.createdAt.toISOString(),
        updatedAt: program.updatedAt.toISOString(),
      })),
      currentUser: user,
    };
  } catch (error) {
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
        const programData = {
          name: formData.get("name") as string,
          departmentId: formData.get("departmentId") as string,
        };

        const program = await createProgram(programData, {
          ...user,
          role: user.role as UserRole,
        });
        return {
          success: true,
          message: "Program created successfully",
          program,
        };
      }

      case "update": {
        const id = formData.get("id") as string;
        const programData = {
          name: formData.get("name") as string,
        };

        const program = await updateProgram(id, programData, {
          ...user,
          role: user.role as UserRole,
        });
        return {
          success: true,
          message: "Program updated successfully",
          program,
        };
      }

      case "delete": {
        const id = formData.get("id") as string;
        await deleteProgram(id, { ...user, role: user.role as UserRole });
        return {
          success: true,
          message: "Program deleted successfully",
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

export default function ProgramManagement() {
  const { programs, currentUser } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const actionData = useActionData<ActionData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [currentProgram, setCurrentProgram] = useState<Partial<Program> | null>(
    null
  );
  const [expandedPrograms, setExpandedPrograms] = useState<
    Record<string, boolean>
  >({});
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      revalidate();
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const toggleProgramDetails = (programId: string) => {
    setExpandedPrograms((prev) => ({
      ...prev,
      [programId]: !prev[programId],
    }));
  };

  const openEditModal = (program: Program) => {
    setCurrentProgram(program);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentProgram({
      name: "",
      department:
        currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR
          ? {
              id: currentUser.department?.id || "",
              name: currentUser.department?.name || "",
            }
          : null,
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setProgramToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProgram(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProgramToDelete(null);
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
      id: "name",
      cell: (info: { row: { original: Program } }) => (
        <div className="flex items-center">
          <button
            onClick={() => toggleProgramDetails(info.row.original.id)}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            {expandedPrograms[info.row.original.id] ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <span>{info.row.original.name}</span>
        </div>
      ),
      header: () => (
        <span className="flex items-center">
          <BookOpenText className="me-2" size={16} /> Program Name
        </span>
      ),
    },
    {
      id: "department",
      cell: (info: { row: { original: Program } }) =>
        info.row.original.department?.name || "No department",
      header: () => (
        <span className="flex items-center">
          <Building className="me-2" size={16} /> Department
        </span>
      ),
    },
    {
      id: "university",
      cell: (info: { row: { original: Program } }) =>
        info.row.original.department?.university?.name || "No university",
      header: () => (
        <span className="flex items-center">
          <GraduationCap className="me-2" size={16} /> University
        </span>
      ),
    },
    {
      id: "requirements",
      cell: (info: { row: { original: Program } }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {info.row.original.requirements.length} requirements
        </span>
      ),
      header: "Requirements",
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Program } }) => (
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
            Program Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage academic programs and their requirements
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          {currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && (
            <button
              onClick={openCreateModal}
              className="bg-green-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
            >
              <PlusCircle className="mr-2" size={18} />
              Add Program
            </button>
          )}
        </div>
      </div>

      <GenericTable data={programs} columns={columns} />

      {/* Create/Edit Modal */}
      {isModalOpen && currentProgram && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentProgram.id ? "Edit Program" : "Create New Program"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentProgram.id ? "update" : "create"}
                />
                {currentProgram.id && (
                  <input type="hidden" name="id" value={currentProgram.id} />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={currentProgram.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                        {currentUser.department?.name ||
                          "No department assigned"}
                      </div>
                      <input
                        type="hidden"
                        name="departmentId"
                        value={currentUser.department?.id || ""}
                      />
                    </div>
                  )}
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
                      {currentProgram.id ? "Update" : "Create"}
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
                Are you sure you want to delete this program? This will also
                delete all associated requirements and cannot be undone.
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
                    value={programToDelete || ""}
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
