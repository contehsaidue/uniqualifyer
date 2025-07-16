import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export default function CatchAll() {
  return <div>Not Found</div>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    );
  }

  return <div>An unexpected error occurred</div>;
}