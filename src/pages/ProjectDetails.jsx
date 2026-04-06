import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();


  const [project, setProject] = useState(null);

  // 🔥 FETCH PROJECT
  useEffect(() => {
    const fetchProject = async () => {
      const snap = await getDoc(doc(db, "projects", id));
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });
      }
    };
    fetchProject();
  }, [id]);

  if (!project) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="bg-white p-5 rounded-xl shadow mb-6">

        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-semibold">
            Project Data
          </h1>

          {/* <button className="bg-primary text-white px-4 py-2 rounded">
            View Progress Report
          </button> */}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          ID: {project.projectId} / Client:{" "}
          {project.clientContactDetails?.clientName} / Project:{" "}
          {project.projectName}
        </p>

        {/* PROGRESS */}
        <div className="grid grid-cols-2 gap-6">

          <div>
            <p className="text-sm text-gray-500">Actual Progress</p>
            <div className="w-full bg-gray-200 h-2 rounded mt-1">
              <div
                className="bg-red-500 h-2 rounded"
                style={{
                  width: `${project.projectActualProgress || 0}%`,
                }}
              />
            </div>
            <p className="text-xs mt-1">
              {project.projectActualProgress || 0}%
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Estimated Progress</p>
            <div className="w-full bg-gray-200 h-2 rounded mt-1">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{
                  width: `${project.projectEstimatedProgress || 0}%`,
                }}
              />
            </div>
            <p className="text-xs mt-1">
              {project.projectEstimatedProgress || 0}%
            </p>
          </div>

        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="grid grid-cols-4 gap-6">

        {FEATURES.map((f, i) => (
          <div
            key={i}
            onClick={() => {
                console.log("here... path: " + f.path)
                navigate(`/projects/${id}/${f.path}`)
            }}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full border-2 border-blue-400 flex items-center justify-center mb-3">
              <span className="text-2xl">{f.icon}</span>
            </div>

            <p className="text-sm text-center text-gray-700">
              {f.label}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}

const FEATURES = [
  { label: "Basic Details", icon: "👤", path: "overview"},
  { label: "Quotation Generator", icon: "🧾" , path: "quotation"},
  { label: "Project Management", icon: "📊", path: "milestones"},
  { label: "Project Payments", icon: "💰", path: "payments" },
  { label: "Site Progress Uploads", icon: "📸", path: "site-progress" },
  { label: "Communication", icon: "💬", path: "comms" },
];