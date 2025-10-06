import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { getSession, destroySession } from "@/utils/session.server";
import { getUserBySession } from "~/services/auth.service.server";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");

  const user = await getUserBySession(refreshToken);
  if (!user) {
    if (refreshToken) {
      throw redirect("/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
    throw redirect("/login");
  }

  return { user };
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Sidebar user={{ ...user, name: user.name ?? "User" }} />
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
