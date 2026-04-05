import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ProjectModal from "../components/ProjectModal";
import { useNavigate } from "react-router-dom";

const STAGES = ["Planning", "Designing", "Execution", "Completed"];

export default function Projects() {
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const role = dbUser?.role || "EMPLOYEE";
  const uid = user?.uid;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // 🔥 FETCH USERS
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setUsers(list);
  };

  // 🔥 FETCH PROJECTS
  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setProjects(list);
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  // 🔥 FILTERING
  useEffect(() => {
    let data = [...projects];

    // ROLE FILTER
    if (role === "EMPLOYEE") {
      data = data.filter((p) =>
        (p.projectAssignedTo || []).includes(uid)
      );
    }

    if (role === "CLIENT") {
      data = data.filter(
        (p) =>
          p.clientContactDetails?.clientNumber === dbUser?.number
      );
    }

    // SEARCH
    if (search) {
      data = data.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
          p.clientContactDetails?.clientName
            ?.toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    // STAGE
    if (stageFilter) {
      data = data.filter((p) => p.projectStage === stageFilter);
    }

    setFiltered(data);
  }, [projects, search, stageFilter, role, uid, dbUser]);

  // 🔥 DELETE
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "projects", id));
    fetchProjects();
  };

  // 🔥 USER NAME MAP
  const getUserName = (uid) => {
    const u = users.find((u) => u.id === uid);
    return u?.name || "—";
  };

  // 🔥 STAGE BADGE
 const getStageColor = (stage) => {
  switch (stage) {
    case "Planning":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "Designing":
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "Execution":
      return "bg-purple-50 text-purple-700 border border-purple-200";
    case "Completed":
      return "bg-green-50 text-green-700 border border-green-200";
    default:
      return "bg-gray-50 text-gray-600 border";
  }
};

  return (
    <div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-3xl font-semibold text-gray-800">
      Projects
    </h1>
    <p className="text-sm text-gray-500 mt-1">
      {filtered.length} total projects
    </p>
  </div>

  {isAdmin && (
    <button
      onClick={() => {
        setEditingProject(null);
        setModalOpen(true);
      }}
      className="bg-primary text-white px-5 py-2 rounded-lg shadow hover:opacity-90 transition"
    >
      + New Project
    </button>
  )}
</div>

      {/* FILTERS */}
     <div className="flex gap-3 mb-5">

  <input
    placeholder="Search projects..."
    className="border rounded-lg px-4 py-2 w-full shadow-sm focus:ring-2 focus:ring-primary outline-none"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    className="border rounded-lg px-3 py-2 shadow-sm"
    value={stageFilter}
    onChange={(e) => setStageFilter(e.target.value)}
  >
    <option value="">All Stages</option>
    {STAGES.map((s) => (
      <option key={s}>{s}</option>
    ))}
  </select>

</div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
  <table className="w-full text-sm">

    <thead className="bg-gray-50 text-gray-600">
      <tr>
        <th className="p-4 text-left font-medium">Project</th>
        <th className="p-4 text-left font-medium">Client</th>
        <th className="p-4 text-left font-medium">Stage</th>
        <th className="p-4 text-left font-medium">Owner</th>
        <th className="p-4 text-left font-medium">Assigned</th>
        <th className="p-4 text-left font-medium">Start</th>
        <th className="p-4 text-left font-medium">Handover</th>
        <th className="p-4 text-left font-medium">Budget</th>
        <th className="p-4 text-left font-medium">Actions</th>
      </tr>
    </thead>

    <tbody>
      {filtered.map((p) => (
        <tr
          key={p.id}
          onClick={() => navigate(`/projects/${p.id}`)}
          className="border-t hover:bg-gray-50 transition"
        >

          <td className="p-4 font-semibold text-gray-800">
            {p.projectName}
          </td>

          <td className="p-4 text-gray-600">
            {p.clientContactDetails?.clientName || "-"}
          </td>

          <td className="p-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(
                p.projectStage
              )}`}
            >
              {p.projectStage}
            </span>
          </td>

          <td className="p-4 text-gray-600">
            {p.projectOwner}
          </td>

          <td className="p-4 text-gray-600">
            {getUserName(p.projectAssignedTo?.[0])}
          </td>

          <td className="p-4 text-gray-500">
            {p.projectTentativeStartDate || "-"}
          </td>

          <td className="p-4 text-gray-500">
            {p.projectExpectedHandoverDate || "-"}
          </td>

          <td className="p-4 text-gray-700 font-medium">
            {p.projectBudget || "-"}
          </td>

          <td className="p-4 flex gap-3 text-sm">
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setEditingProject(p);
                    setModalOpen(true);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          </td>

        </tr>
      ))}
    </tbody>

  </table>
</div>

      {/* MODAL */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
            setModalOpen(false)
            setEditingProject(null)
            console.log(editingProject)
            console.log("editingProject")
        }}
        editingProject={editingProject}
        refresh={fetchProjects}
      />

    </div>
  );
}