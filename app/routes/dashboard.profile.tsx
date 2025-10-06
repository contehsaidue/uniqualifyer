import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession, updateUser } from "~/services/auth.service.server";
import { validateEmail } from "@/utils/validators";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User, Mail, Phone, Shield, Edit } from "lucide-react";

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
      createdAt: user?.createdAt?.toISOString(),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // Validation
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

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message);
      setIsEditing(false);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  // Safely parse the date
  const joinDate = user.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <Form method="post" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
              >
                <User size={16} />
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
                className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
              >
                <Mail size={16} />
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Mail size={16} />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Shield size={16} />
                <span className="text-sm font-medium">Account Type</span>
              </div>
              <p className="text-gray-900 capitalize">
                {user.role.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <span className="text-sm font-medium">Member Since</span>
              </div>
              <p className="text-gray-900">
                {joinDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Password</h3>
            <p className="text-sm text-gray-600">
              Last changed on {new Date().toLocaleDateString()}
            </p>
          </div>
          <a
            href="/dashboard/change-password"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
          >
            Change Password →
          </a>
        </div>
      </div>
    </div>
  );
}
