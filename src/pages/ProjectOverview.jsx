import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ChevronRight } from "lucide-react";
import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      const snap = await getDoc(doc(db, "projects", id));
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });
      }
    };
    fetchProject();
  }, [id]);

  if (!project) return <div className="p-6 text-gray-400">Loading project...</div>;

  return (
    <div className="p-6 space-y-6">
      <NavigationHeader
        title="Project Overview"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: project.projectName },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* ===== HEADER ===== */}
      <div className="bg-white border rounded-2xl p-6 space-y-4">

        {/* Title */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {project.projectName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {project.clientContactDetails?.clientName} • {project.projectId}
            </p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <Meta label="Stage" value={project.projectStage} />
          <Meta label="Scope" value={project.projectScope} />
          <Meta label="Start Date" value={project.projectTentativeStartDate || "-"} />
          <Meta label="Handover" value={project.projectExpectedHandoverDate || "-"} />
        </div>

        {/* Progress */}
        <div className="grid grid-cols-2 gap-6 pt-2">

          <ProgressCard
            label="Actual Progress"
            value={project.projectActualProgress}
            color="bg-primary"
          />

          <ProgressCard
            label="Estimated Progress"
            value={project.projectEstimatedProgress}
            color="bg-gray-400"
          />

        </div>
      </div>

      {/* ===== FEATURES ===== */}
      <div className="grid grid-cols-3 gap-4">

        {FEATURES.map((f, i) => (
          <div
            key={i}
            onClick={() => navigate(`/projects/${id}/${f.path}`)}
            className="bg-white border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                {f.icon}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">
                  {f.label}
                </p>
                <p className="text-xs text-gray-400">
                  Open section
                </p>
              </div>
            </div>

            <ChevronRight
              size={18}
              className="text-gray-400 group-hover:translate-x-1 transition"
            />
          </div>
        ))}

      </div>

    </div>
  );
}

/* ===== SMALL COMPONENTS ===== */

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">
        {value || "-"}
      </p>
    </div>
  );
}

function ProgressCard({ label, value, color }) {
  const v = value || 0;

  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${v}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">{v}%</p>
    </div>
  );
}

/* ===== FEATURES ===== */

const FEATURES = [
  { label: "Basic Details", icon: "👤", path: "details" },
  { label: "Quotation Generator", icon: "🧾", path: "quotation" },
  { label: "Project Management", icon: "📊", path: "milestones" },
  { label: "Project Payments", icon: "💰", path: "payments" },
  { label: "Site Progress Uploads", icon: "📸", path: "site-progress" },
  { label: "Communication", icon: "💬", path: "comms" },
];