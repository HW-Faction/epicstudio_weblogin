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

import NavigationHeader from "../components/NavigationHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";

const STAGES = ["Planning", "Designing", "Execution", "Completed"];

export default function Projects() {
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const role = dbUser?.role || "EMPLOYEE";
  const uid = user?.uid;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // ===== FETCH =====
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProjects = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  // ===== FILTER + SORT =====
  useEffect(() => {
    let data = [...projects];

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

    if (search) {
      data = data.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
          p.clientContactDetails?.clientName
            ?.toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (stageFilter) {
      data = data.filter((p) => p.projectStage === stageFilter);
    }

    // SORT
    data.sort((a, b) => {
      if (sortBy === "budget") {
        return Number(b.projectBudget || 0) - Number(a.projectBudget || 0);
      }
      if (sortBy === "start") {
        return new Date(b.projectTentativeStartDate || 0) - new Date(a.projectTentativeStartDate || 0);
      }
      return a.projectName.localeCompare(b.projectName);
    });

    setFiltered(data);
  }, [projects, search, stageFilter, sortBy, role, uid, dbUser]);

  // ===== DELETE =====
  const handleDelete = async () => {
    await deleteDoc(doc(db, "projects", confirm.id));
    setConfirm(null);
    setSnackbar({ type: "error", message: "Deleted" });
    fetchProjects();
  };

  const getUserName = (uid) => {
    const u = users.find((u) => u.id === uid);
    return u?.name || "—";
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "Planning":
        return "bg-blue-50 text-blue-700";
      case "Designing":
        return "bg-yellow-50 text-yellow-700";
      case "Execution":
        return "bg-purple-50 text-purple-700";
      case "Completed":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader title="Projects" rightContent={
          <div className="flex justify-end items-center">
            <p className="text-md text-sky-900 mr-4">
            Total : {filtered.length} projects
            </p>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setModalOpen(true);
                }}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
              >
                + New Project
              </button>
            )}
          </div>
      } />      

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search projects..."
          className="border rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="budget">Sort by Budget</option>
          <option value="start">Sort by Start Date</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-10 px-4 py-2 text-xs text-gray-500 border-b">
          <span>Project</span>
          <span className="text-center">Client</span>
          <span className="text-center">Stage</span>
          <span className="text-center">Owner</span>
          <span className="text-center">Assigned</span>
          <span className="text-center">Progress</span>
          <span className="text-center">Start</span>
          <span className="text-center">Handover</span>
          <span className="text-center">Budget</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.map((p) => {
          const assigned = p.projectAssignedTo || [];

          return (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="group grid grid-cols-10 px-4 py-3 text-sm items-center border-b hover:bg-gray-50 cursor-pointer"
            >
              {/* PROJECT */}
              <span className="font-medium text-gray-800 ">
                {p.projectName}
              </span>

              {/* CLIENT */}
              <span className="text-gray-600 text-center">
                {p.clientContactDetails?.clientName || "-"}
              </span>

              {/* STAGE */}
              <span className="text-center">
                <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(p.projectStage)}`}>
                  {p.projectStage}
                </span>
              </span>

              {/* OWNER */}
              <span className="text-gray-600 text-center">{p.projectOwner}</span>

              {/* 👤 ASSIGNED AVATARS */}
              <span className="flex justify-center ">
                <div className="flex -space-x-1 text-center items-center">
                  {assigned.slice(0, 3).map((uid, i) => {
                    const name = getUserName(uid);
                    return (
                      <div
                        key={i}
                        title={name}
                        className="w-7 h-7 text-white text-center rounded-full bg-gray-500 text-xs flex items-center justify-center border border-white"
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}

                  {assigned.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-xs flex items-center justify-center border border-white">
                      +{assigned.length - 3}
                    </div>
                  )}
                </div>
              </span>
              

              {/* 📊 PROGRESS */}
              <div className="w-full text-center pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-100 h-2 rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${p.projectActualProgress || 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {p.projectActualProgress || 0}%
                  </span>
                </div>
              </div>

              {/* DATES */}
              <span className="text-gray-500 text-center">
                {p.projectTentativeStartDate || "-"}
              </span>

              <span className="text-gray-500 text-center">
                {p.projectExpectedHandoverDate || "-"}
              </span>

              {/* BUDGET */}
              <span className="text-gray-700 font-medium text-center">
                ₹ {p.projectBudget || "-"}
              </span>

              {/* ⚡ HOVER ACTIONS */}
              <div
                className="flex justify-end gap-3 text-xs  transition"
                onClick={(e) => e.stopPropagation()}
              >
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setModalOpen(true);
                      }}
                      className="text-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setConfirm(p)}
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* MODAL */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        editingProject={editingProject}
        refresh={fetchProjects}
      />

      {/* CONFIRM */}
      {confirm && (
        <ConfirmDialog
          title={"Delete Project?"}
          message={"Are you sure of this action?"}
          open={!!confirm}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* SNACKBAR */}
      {snackbar && <Snackbar data={snackbar} />}

    </div>
  );
}