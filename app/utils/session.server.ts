import { logoutUser } from "@/services/auth.service";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { Session, SessionData } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET || "57f3f653b55d46af0355019085adce896bb38483c673fddd5a948e996664352b";
if (!process.env.SESSION_SECRET) {
  console.warn("⚠️ No SESSION_SECRET set, using insecure default!");
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "__session", 
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, 
  },
});

/**
 * Get session from request headers
 */
export async function getSessionFromRequest(request: Request): Promise<Session<SessionData>> {
  const cookie = request.headers.get("Cookie"); 
  return getSession(cookie);
}

/**
 * Get user session with authentication data
 */
export async function getAuthenticatedSession(request: Request) {
  const session = await getSessionFromRequest(request);
  
  return {
    session,
    accessToken: session.get("accessToken") as string | undefined,
    refreshToken: session.get("refreshToken") as string | undefined,
    userId: session.get("userId") as string | undefined,
  };
}

/**
 * Create new session with user data
 */
export async function createUserSession({
  request,
  userId,
  accessToken,
  refreshToken,
  redirectTo = "/",
}: {
  request: Request;
  userId: string;
  accessToken: string;
  refreshToken: string;
  redirectTo?: string;
}) {
  const session = await getSessionFromRequest(request);
  
  session.set("userId", userId);
  session.set("accessToken", accessToken);
  session.set("refreshToken", refreshToken);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

/**
 * Destroy session and log user out
 */
export async function destroyUserSession(
  request: Request, 
  redirectTo: string = "/login",
  options: { clearToken?: boolean } = { clearToken: true }
) {
  const session = await getSessionFromRequest(request);
  
  if (options.clearToken) {
    const refreshToken = session.get("refreshToken");
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (error) {
        console.error("Error during token invalidation:", error);
      }
    }
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

/**
 * Refresh session with new tokens
 */
export async function refreshSession({
  request,
  newAccessToken,
  newRefreshToken,
}: {
  request: Request;
  newAccessToken: string;
  newRefreshToken?: string;
}) {
  const session = await getSessionFromRequest(request);
  
  session.set("accessToken", newAccessToken);
  if (newRefreshToken) {
    session.set("refreshToken", newRefreshToken);
  }

  return {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  };
}

export { getSession, commitSession, destroySession };