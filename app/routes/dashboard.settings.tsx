import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession, updateUser } from "@/services/auth.service";
import { UserRole } from "@prisma/client";
import { validateEmail } from "@/utils/validators";
import { toast } from "sonner";
import { useEffect } from "react";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    throw redirect("/auth/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    throw redirect("/auth/login");
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  // Basic validation
  if (!name || !email) {
    return json({ error: "Name and email are required" }, { status: 400 });
  }

  if (!validateEmail(email)) {
    return json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  try {
    await updateUser(user.id, {
      name,
      email,
      phoneNumber: phoneNumber || null,
    });

    return json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}

export default function SettingsPage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Account Settings
      </h1>

      <Form method="post" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={user.name}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={user.email}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-100 rounded">
              {user.role === UserRole.SUPER_ADMIN && "Super Administrator"}
              {user.role === UserRole.DEPARTMENT_ADMINISTRATOR &&
                "Department Administrator"}
              {user.role === UserRole.STUDENT && "Student"}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </Form>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900">Security</h2>
        <div className="mt-4">
          <Link
            to="/dashboard/change-password"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Change Password →
          </Link>
        </div>
      </div>
    </div>
  );
}
