import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function NavigationHeader({
  title,
  breadcrumbs = [],
  rightContent,
  showBack = true,
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-6 space-y-2 -mt-8">

      {/* TOP ROW */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-1">

          {/* BACK BUTTON */}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
          )}

          {/* TITLE */}
          <h1 className="text-lg font-semibold text-gray-800">
            {title}
          </h1>

        </div>

        {/* RIGHT SIDE */}
        {rightContent && <div>{rightContent}</div>}

      </div>

      {/* BREADCRUMBS */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center text-sm text-gray-500 gap-1">

          {breadcrumbs.map((b, i) => (
            <div key={i} className="flex items-center gap-1">

              <span
                onClick={() => b.path && navigate(b.path)}
                className={`${
                  b.path
                    ? "cursor-pointer hover:text-gray-700"
                    : "text-gray-400"
                }`}
              >
                {b.label}
              </span>

              {i !== breadcrumbs.length - 1 && (
                <ChevronRight size={14} />
              )}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}