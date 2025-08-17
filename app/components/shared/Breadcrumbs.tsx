import { ChevronRight, HomeIcon } from "lucide-react";
import { Link, useMatches } from "@remix-run/react";

type BreadcrumbHandle = {
  breadcrumb?: (data: unknown) => React.ReactNode;
};

const Breadcrumbs = () => {
  const matches = useMatches() as Array<{
    pathname: string;
    data: unknown;
    handle?: BreadcrumbHandle;
  }>;

  // Filter out routes that don't have a breadcrumb
  const breadcrumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => ({
      pathname: match.pathname,
      breadcrumb: match.handle!.breadcrumb!(match.data),
    }));

  return (
    <nav aria-label="breadcrumb" className="py-2 mx-4 sm:mx-0">
      <ol className="flex items-center space-x-2 text-sm text-gray-500 mx-4">
        <li className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[#45C2C4] hover:underline"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        {breadcrumbs.map(({ pathname, breadcrumb }, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={pathname} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {isLast ? (
                <span className="text-gray-700 font-medium capitalize">
                  {breadcrumb}
                </span>
              ) : (
                <Link
                  to={pathname}
                  className="!text-gray-600 hover:underline capitalize"
                >
                  {breadcrumb}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
