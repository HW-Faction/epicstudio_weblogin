import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function ProjectNavigationChips() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const tabs = [
    { label: "Overview", path: "" },
    { label: "Details", path: "details" },
    { label: "Milestones", path: "milestones" },
    { label: "Payments", path: "payments" },
    { label: "Uploads", path: "site-progress" },
    { label: "Communication", path: "comms" },
  ];

  const isActive = (path) => {
    const fullPath = `/projects/${id}/${path}`;
    return location.pathname === fullPath || (path === "" && location.pathname === `/projects/${id}`);
  };

  return (
    <div className="flex items-center gap-2">

      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() =>
            navigate(`/projects/${id}${tab.path ? `/${tab.path}` : ""}`)
          }
          className={`px-3 py-1.5 text-sm rounded-full transition ${
            isActive(tab.path)
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}

    </div>
  );
}