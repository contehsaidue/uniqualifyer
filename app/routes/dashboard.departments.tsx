import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useSubmit,
  Link,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "~/services/auth.service.server";
import { useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "@/services/department.service";
import { toast } from "sonner";
import { useRevalidator } from "@remix-run/react";
import {
  ArrowRightCircle,
  Edit,
  Trash,
  Building2,
  Hash,
  Link as LinkIcon,
  Users,
  UniversityIcon,
} from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";
import { getUniversities } from "~/services/university.service";

interface Department {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  university?: {
    id: string;
    name: string;
  };
  administrators?: {
    id: string;
    name: string;
    email: string;
  }[];
}

interface DepartmentFormData {
  name: string;
  code: string;
  universityId: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");

  if (!session || !refreshToken) {
    throw redirect("/auth/login");
  }

  const user = await getUserBySession(refreshToken);

  if (!user) {
    throw redirect("/auth/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  if (!user.role) {
    return new Response(JSON.stringify({ error: "User role missing" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.DEPARTMENT_ADMINISTRATOR
  ) {
    throw redirect("/dashboard");
  }

  try {
    const [departments, universities] = await Promise.all([
      getDepartments({
        ...user,
        role: user.role as UserRole,
      }),
      getUniversities({
        ...user,
        role: user.role as UserRole,
      }),
    ]);

    return {
      departments: departments.map((dept) => ({
        ...dept,
        createdAt: dept.createdAt.toISOString(),
        updatedAt: dept.updatedAt.toISOString(),
      })),
      universities: universities.map((uni) => ({
        id: uni.id,
        name: uni.name,
        slug: uni.slug,
        createdAt: uni.createdAt.toISOString(),
        updatedAt: uni.updatedAt.toISOString(),
      })),
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.department?.id,
      },
    };
  } catch (error) {
    console.error("Failed to load data:", error);
    return new Response(JSON.stringify({ error: "Failed to load data" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
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

    let message = "";
    if (actionType === "create") {
      message = "Department created successfully";
    } else if (actionType === "update") {
      message = "Department updated successfully";
    } else if (actionType === "delete") {
      message = "Department deleted successfully";
    }

    if (!message) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    switch (actionType) {
      case "create": {
        const departmentData: DepartmentFormData = {
          name: formData.get("name") as string,
          code: formData.get("code") as string,
          universityId: formData.get("universityId") as string,
        };

        await createDepartment(departmentData, {
          ...user,
          role: user.role as UserRole,
        });
        break;
      }

      case "update": {
        const id = formData.get("id") as string;
        const departmentData: Partial<DepartmentFormData> = {
          name: formData.get("name") as string,
          code: formData.get("code") as string,
          universityId: formData.get("universityId") as string,
        };

        await updateDepartment(id, departmentData, {
          ...user,
          role: user.role as UserRole,
        });
        break;
      }

      case "delete": {
        const id = formData.get("id") as string;
        await deleteDepartment(id, { ...user, role: user.role as UserRole });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
    }

    return { success: true, message };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Operation failed",
      status: 400,
    };
  }
}

export default function DepartmentManagement() {
  const loaderData = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const actionData = useActionData<typeof action>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(
    null
  );
  const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false);
  const [currentAdmins, setCurrentAdmins] = useState<{
    departmentName: string;
    admins: {
      id: string;
      name: string;
      email: string;
    }[];
  } | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<{
    id?: string;
    name: string;
    code: string;
    universityId: string;
  } | null>(null);
  const submit = useSubmit();

  // Handle case where loader returns an error response
  if ("error" in loaderData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{loaderData.error}</p>
        </div>
      </div>
    );
  }

  const { departments, universities, currentUser } = loaderData;

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      revalidate();
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openEditModal = (department: Department) => {
    setCurrentDepartment({
      id: department.id,
      name: department.name,
      code: department.code,
      universityId: department.universityId,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentDepartment({
      name: "",
      code: "",
      universityId: universities[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDepartmentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDepartment(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const openAdminsModal = (department: Department) => {
    setCurrentAdmins({
      departmentName: department.name,
      admins: department.administrators || [],
    });
    setIsAdminsModalOpen(true);
  };

  const closeAdminsModal = () => {
    setIsAdminsModalOpen(false);
    setCurrentAdmins(null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeModal();
    submit(e.currentTarget, { method: "post", replace: true });
  };

  const columns = [
    {
      accessorKey: "index",
      header: () => <span className="flex justify-content-center">SN</span>,
      cell: ({ row }: { row: { index: number } }) => row.index + 1,
    },
    {
      id: "name",
      cell: (info: { row: { original: Department } }) => info.row.original.name,
      header: () => (
        <span className="flex items-center">
          <Building2 className="me-2" size={16} /> Name
        </span>
      ),
    },
    {
      id: "code",
      cell: (info: { row: { original: Department } }) => info.row.original.code,
      header: () => (
        <span className="flex items-center">
          <Hash className="me-2" size={16} /> Code
        </span>
      ),
    },
    {
      id: "university",
      cell: (info: { row: { original: Department } }) =>
        info.row.original.university?.name || "N/A",
      header: () => (
        <span className="flex items-center">
          <UniversityIcon className="me-2" size={16} /> University
        </span>
      ),
    },
    {
      id: "administrators",
      cell: (info: { row: { original: Department } }) =>
        info.row.original.administrators?.length || 0,
      header: () => (
        <span className="flex items-center">
          <Users className="me-2" size={16} /> Admins
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Department } }) => (
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="p-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold flex items-center justify-center rounded"
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

          <button
            onClick={() => openAdminsModal(row.original)}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="View Admins"
          >
            <Users size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">View Admins</span>
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
            Department Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage academic departments and their administrators
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          {(currentUser.role === UserRole.SUPER_ADMIN ||
            currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) && (
            <button
              onClick={openCreateModal}
              className="bg-green-500 text-white py-1 px-2 rounded text-sm font-bold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 inline-flex items-center"
            >
              Add New <ArrowRightCircle className="ml-2" size={18} />
            </button>
          )}
        </div>
      </div>

      <GenericTable data={departments} columns={columns} />

      {/* Create/Edit Modal */}
      {isModalOpen && currentDepartment && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentDepartment.id
                  ? "Edit Department"
                  : "Create New Department"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentDepartment.id ? "update" : "create"}
                />
                {currentDepartment.id && (
                  <input type="hidden" name="id" value={currentDepartment.id} />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={currentDepartment.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      defaultValue={currentDepartment.code}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University
                    </label>
                    <select
                      name="universityId"
                      defaultValue={currentDepartment.universityId}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a University</option>
                      {universities.map((university: any) => (
                        <option key={university.id} value={university.id}>
                          {university.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {currentDepartment.id ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Admins Modal */}
      {isAdminsModalOpen && currentAdmins && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Administrators for {currentAdmins.departmentName}
              </h2>

              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SN.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAdmins.admins.length > 0 ? (
                      currentAdmins.admins.map((admin, index) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {admin.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.email}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No administrators assigned to this department
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={closeAdminsModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
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
                Are you sure you want to delete this department? This will also
                remove all associated administrators. This action cannot be
                undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <Form method="post" onSubmit={closeDeleteModal}>
                  <input type="hidden" name="_action" value="delete" />
                  <input
                    type="hidden"
                    name="id"
                    value={departmentToDelete || ""}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
