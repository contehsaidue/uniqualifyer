import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import {
  getUserBySession,
  updateUserPassword,
} from "~/services/auth.service.server";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Key } from "lucide-react";

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
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  return json({ userId: user.id });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");
  const user = await getUserBySession(refreshToken);

  if (!user) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Basic validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return json({ error: "New passwords do not match" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    await updateUserPassword(user.id, currentPassword, newPassword);
    return json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update password",
      },
      { status: 400 }
    );
  }
}

export default function ChangePasswordPage() {
  const { userId } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-3 mb-6">
        <Key className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="userId" value={userId} />

        <div className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                id="currentPassword"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                id="newPassword"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Password
          </button>
        </div>
      </Form>
    </div>
  );
}
