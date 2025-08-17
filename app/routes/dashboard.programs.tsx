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
import {
  createUniversity,
  deleteUniversity,
  getUniversities,
  updateUniversity,
} from "@/services/university.service";
import { toast } from "sonner";
import {
  ArrowRightCircle,
  Edit,
  Trash,
  University as UniversityIcon,
  Link,
} from "lucide-react";
import { GenericTable } from "@/components/shared/GenericTable";

interface University {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  programs?: {
    id: string;
    name: string;
    createdAt: string | Date;
    updatedAt: string | Date;
  }[];
  departments?: {
    id: string;
    name: string;
    createdAt: string | Date;
    updatedAt: string | Date;
  }[];
  administrators?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string | Date;
    updatedAt: string | Date;
  }[];
}

interface UniversityFormData {
  name: string;
  slug: string;
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

  if (user.role !== UserRole.SUPER_ADMIN) {
    throw redirect("/dashboard");
  }

  try {
    const universities = await getUniversities({
      ...user,
      role: user.role as UserRole,
    });
    return {
      universities: universities.map(
        (university: {
          createdAt: { toISOString: () => any };
          updatedAt: { toISOString: () => any };
        }) => ({
          ...university,
          createdAt: university.createdAt.toISOString(),
          updatedAt: university.updatedAt.toISOString(),
        })
      ),
      currentUser: user,
    };
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to load universities" }),
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

    let message = "";
    if (actionType === "create") {
      message = "University created successfully";
    } else if (actionType === "update") {
      message = "University updated successfully";
    } else if (actionType === "delete") {
      message = "University deleted successfully";
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
        const universityData: UniversityFormData = {
          name: formData.get("name") as string,
          slug: formData.get("slug") as string,
        };

        await createUniversity(universityData, {
          ...user,
          role: user.role as UserRole,
        });
        break;
      }

      case "update": {
        const id = formData.get("id") as string;
        const universityData: Partial<UniversityFormData> = {
          name: formData.get("name") as string,
          slug: formData.get("slug") as string,
        };

        await updateUniversity(id, universityData, {
          ...user,
          role: user.role as UserRole,
        });
        break;
      }

      case "delete": {
        const id = formData.get("id") as string;
        await deleteUniversity(id, { ...user, role: user.role as UserRole });
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

export default function UniversityManagement() {
  const { universities, currentUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [universityToDelete, setUniversityToDelete] = useState<string | null>(
    null
  );
  const [currentUniversity, setCurrentUniversity] = useState<{
    id?: string;
    name: string;
    slug: string;
  } | null>(null);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const openEditModal = (university: {
    id: string;
    name: string;
    slug: string;
  }) => {
    setCurrentUniversity(university);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setCurrentUniversity({
      name: "",
      slug: "",
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setUniversityToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUniversity(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUniversityToDelete(null);
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
      cell: (info: { row: { original: University } }) => info.row.original.name,
      header: () => (
        <span className="flex items-center">
          <UniversityIcon className="me-2" size={16} /> Name
        </span>
      ),
    },
    {
      id: "slug",
      cell: (info: { row: { original: University } }) => info.row.original.slug,
      header: () => (
        <span className="flex items-center">
          <Link className="me-2" size={16} /> Slug
        </span>
      ),
    },

    {
      id: "actions",
      cell: ({ row }: { row: { original: University } }) => (
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
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap mb-6">
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold text-gray-900">
            University Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage universities and their basic information
          </p>
        </div>
        <div className="w-full md:w-1/3 text-right mt-3 md:mt-0">
          {currentUser.role === UserRole.SUPER_ADMIN && (
            <button
              onClick={openCreateModal}
              className="bg-green-500 text-white py-1 px-2 rounded text-sm font-bold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 inline-flex items-center"
            >
              Add New <ArrowRightCircle className="ml-2" size={18} />
            </button>
          )}
        </div>
      </div>

      <GenericTable data={universities} columns={columns} />

      {/* Create/Edit Modal */}
      {isModalOpen && currentUniversity && (
        <div className="fixed inset-0 bg-gray-800/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentUniversity.id
                  ? "Edit University"
                  : "Create New University"}
              </h2>

              <Form method="post" onSubmit={handleFormSubmit}>
                <input
                  type="hidden"
                  name="_action"
                  value={currentUniversity.id ? "update" : "create"}
                />
                {currentUniversity.id && (
                  <input type="hidden" name="id" value={currentUniversity.id} />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={currentUniversity.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={currentUniversity.slug}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used in URLs (e.g., "university-name")
                    </p>
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
                      {currentUniversity.id ? "Update" : "Create"}
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
                Are you sure you want to delete this university? This action
                cannot be undone.
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
                    value={universityToDelete || ""}
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
