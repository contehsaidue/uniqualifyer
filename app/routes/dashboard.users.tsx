import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  resetUserPassword,
} from "~/services/user.service";
import { GenericTable } from "@/components/shared/GenericTable";
import {
  ArrowRightCircle,
  Edit,
  Trash,
  User,
  Settings,
  Key,
  MailCheckIcon,
  UserCheckIcon,
  Building2Icon,
} from "lucide-react";
import { USER_ROLES } from "@/utils/constants";
import { toast } from "sonner";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentId?: string;
  phoneNumber?: string;
  countryCode?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  department_administrator?: {
    department?: {
      id: string;
      name: string;
      university: {
        id: string;
        name: string;
      };
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

  if (
    user.role !== USER_ROLES.DEPARTMENT_ADMINISTRATOR &&
    user.role !== USER_ROLES.SUPER_ADMIN
  ) {
    throw redirect("/dashboard");
  }

  try {
    const [adminUsers, departments] = await Promise.all([
      getAdminUsers({ ...user, role: user.role as UserRole }),
      prisma.department.findMany({
        include: { university: true },
      }),
    ]);

    return {
      adminUsers: adminUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      departments,
      currentUser: user,
    };
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid action" }), {
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
      message = "User created successfully";
    } else if (actionType === "update") {
      message = "User updated successfully";
    } else if (actionType === "delete") {
      message = "User deleted successfully";
    } else if (actionType === "reset-password") {
      message = "Password reset successfully";
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
        const userData: UserFormData = {
          firstName: formData.get("firstName") as string,
          lastName: formData.get("lastName") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as string,
          departmentId: (formData.get("departmentId") as string) || undefined,
        };

        await createAdminUser(
          {
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            password: "123456",
            role: userData.role as UserRole,
            departmentId: userData.departmentId,
          },
          { ...user, role: user.role as UserRole }
        );
        break;
      }

      case "update": {
        const userId = formData.get("userId") as string;
        const userData: Partial<UserFormData> = {
          firstName: formData.get("firstName") as string,
          lastName: formData.get("lastName") as string,
          email: formData.get("email") as string,
          role: formData.get("role") as UserRole,
          departmentId: (formData.get("departmentId") as string) || undefined,
        };

        await updateAdminUser(
          userId,
          {
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            role: userData.role as UserRole,
            departmentId: userData.departmentId,
          },
          { ...user, role: user.role as UserRole }
        );
        break;
      }

      case "delete": {
        const userId = formData.get("userId") as string;
        await deleteAdminUser(userId, { ...user, role: user.role as UserRole });
        break;
      }

      case "reset-password": {
        const userId = formData.get("userId") as string;
        await resetUserPassword(userId, "123456", {
          ...user,
          role: user.role as UserRole,
        });
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
      error: error instanceof Error ? error.message : "Failed to delete user",
      status: 400,
    };
  }
}

export default function Users() {
  const { adminUsers, departments, currentUser } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const submit = useSubmit();

  const availableRoles = [
    { id: UserRole.DEPARTMENT_ADMINISTRATOR, role: "Department Administrator" },
    ...(currentUser.role === UserRole.SUPER_ADMIN
      ? [{ id: UserRole.SUPER_ADMIN, role: "Super Admin" }]
      : []),
  ];

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeModal();

    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "post",
      replace: true,
    });
  };

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openEditModal = (user: AdminUser) => {
    const [firstName, ...lastNameParts] = user.name.split(" ");
    setCurrentUserData({
      ...user,
      firstName,
      lastName: lastNameParts.join(" "),
      userId: user.id,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentUserData({
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.DEPARTMENT_ADMINISTRATOR,
      departmentId: currentUser.departmentId || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUserData(null);
  };

  const openDeleteModal = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const columns = [
    {
      accessorKey: "index",
      header: () => <span className="flex justify-content-center">SN</span>,
      cell: ({ row }: { row: { index: number } }) => row.index + 1,
    },
    {
      id: "name",
      cell: (info: { row: { original: AdminUser } }) => info.row.original.name,
      header: () => (
        <span className="flex items-center">
          <User className="me-2" size={16} /> Name
        </span>
      ),
    },
    {
      id: "email",
      cell: (info: { row: { original: AdminUser } }) => info.row.original.email,
      header: () => (
        <span className="flex items-center">
          <MailCheckIcon className="me-2" size={16} /> Email
        </span>
      ),
    },
    {
      id: "role",
      cell: (info: { row: { original: AdminUser } }) =>
        info.row.original.role === UserRole.SUPER_ADMIN
          ? "Super Admin"
          : "Department Admin",
      header: () => (
        <span className="flex items-center">
          <UserCheckIcon className="me-2" size={16} /> Role
        </span>
      ),
    },
    {
      id: "department",
      cell: (info: { row: { original: AdminUser } }) =>
        info.row.original.department_administrator?.department?.name || "N/A",
      header: () => (
        <span className="flex items-center">
          <Building2Icon className="me-2" size={16} /> Department
        </span>
      ),
    },

    {
      id: "actions",
      cell: ({ row }: { row: { original: AdminUser } }) => (
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="p-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold flex items-center justify-center rounded"
            aria-label="Edit"
          >
            <Edit size={16} />
            <span className="sr-only sm:not-sr-only sm:ml-2">Edit</span>
          </button>

          {row.original.id !== currentUser.id && (
            <>
              <button
                onClick={() => openDeleteModal(row.original.id)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center rounded"
                aria-label="Delete"
              >
                <Trash size={16} />
                <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
              </button>

              <Form method="post">
                <input type="hidden" name="userId" value={row.original.id} />
                <input type="hidden" name="_action" value="reset-password" />
                <button
                  type="submit"
                  className="p-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center rounded"
                  aria-label="Reset Password"
                >
                  <Key size={16} />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Reset</span>
                </button>
              </Form>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-800 text-sm">
            Create and manage administrative users
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

      {actionData?.error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {actionData.error}
        </div>
      )}

      <GenericTable data={adminUsers} columns={columns} />

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentUserData?.userId ? "Edit User" : "Create New User"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentUserData?.userId ? "update" : "create"}
                />
                {currentUserData?.userId && (
                  <input
                    type="hidden"
                    name="userId"
                    value={currentUserData.userId}
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      defaultValue={currentUserData?.firstName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      defaultValue={currentUserData?.lastName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={currentUserData?.email}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      defaultValue={currentUserData?.role}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentUser.role === UserRole.SUPER_ADMIN && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        name="departmentId"
                        defaultValue={currentUserData?.departmentId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept: any) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.university.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!currentUserData?.userId && (
                    <div className="text-xs text-gray-500">
                      The default password will be: <strong>123456</strong>
                    </div>
                  )}

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
                      {currentUserData?.userId ? "Update" : "Create"}
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
                Are you sure you want to delete this user? This action cannot be
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
                <Form method="post" onSubmit={() => closeDeleteModal()}>
                  <input type="hidden" name="_action" value="delete" />
                  <input
                    type="hidden"
                    name="userId"
                    value={userToDelete || ""}
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
