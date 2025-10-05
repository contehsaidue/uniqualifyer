import type { ActionFunctionArgs } from "@remix-run/node";
import { destroySession, getSession } from "@/utils/session.server";
import { logoutUser } from "~/services/auth.service.server";
import { redirect } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
