import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import NavigationHeader from "../components/NavigationHeader";

const STATUS = ["Not Started", "In Progress", "Completed"];
const PRIORITY = ["low", "medium", "high"];

export default function Tasks() {
  const { user, dbUser } = useAuth();

  const role = dbUser?.role || "EMPLOYEE";
  const uid = user?.uid;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  const [tasks, setTasks] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [view, setView] = useState("BOARD");

  // filters
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ===== FETCH =====
  const fetchAll = async () => {
    const [tSnap, uSnap, pSnap] = await Promise.all([
      getDocs(collection(db, "tasks")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "projects")),
    ]);

    const t = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const u = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const p = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    setTasks(t);
    setUsers(u);
    setProjects(p);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===== FILTER =====
  useEffect(() => {
    let data = [...tasks];

    // role filter
    if (role === "EMPLOYEE") {
      data = data.filter(t =>
        t.taskAssignedTo?.includes(uid)
      );
    }

    // search
    if (search) {
      data = data.filter(t =>
        t.taskName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // user
    if (userFilter) {
      data = data.filter(t =>
        t.taskAssignedTo?.includes(userFilter)
      );
    }

    // project
    if (projectFilter) {
      data = data.filter(t => t.projectId === projectFilter);
    }

    // priority
    if (priorityFilter) {
      data = data.filter(t => t.priority === priorityFilter);
    }

    // status
    if (statusFilter) {
      data = data.filter(t => t.taskStatus === statusFilter);
    }

    setFiltered(data);
  }, [
    tasks,
    search,
    userFilter,
    projectFilter,
    priorityFilter,
    statusFilter,
    role,
    uid,
  ]);

  // ===== HELPERS =====
  const getUserName = (uid) =>
    users.find(u => u.id === uid)?.name || "";

  const getProjectName = (pid) =>
    projects.find(p => p.id === pid)?.projectName || "No Project";

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  // ===== GROUP FOR BOARD =====
  const grouped = {};
  STATUS.forEach(s => {
    grouped[s] = filtered.filter(t => t.taskStatus === s);
  });

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader title="Tasks" />

      {/* VIEW SWITCH */}
      <div className="flex justify-between items-center">

        <div className="flex gap-2">
          {["BOARD", "LIST"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                view === v
                  ? "bg-primary text-white"
                  : "bg-gray-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3">

        <input
          placeholder="Search tasks..."
          className="border rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* USER */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* PROJECT */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>

        {/* PRIORITY */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          {PRIORITY.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

        {/* STATUS */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>

      </div>

      {/* ===== BOARD VIEW ===== */}
      {view === "BOARD" && (
        <div className="grid grid-cols-3 gap-4">

          {STATUS.map(status => (
            <div key={status} className="bg-gray-50 rounded-xl p-3">

              <h3 className="text-sm font-medium mb-3">
                {status}
              </h3>

              <div className="space-y-3">

                {grouped[status].map(task => (
                  <div
                    key={task.id}
                    className="bg-white p-3 rounded-lg border"
                  >

                    <p className="text-sm font-medium">
                      {task.taskName}
                    </p>

                    <p className="text-xs text-gray-500">
                      {getProjectName(task.projectId)}
                    </p>

                    {/* AVATARS */}
                    <div className="flex -space-x-2 mt-2">
                      {task.taskAssignedTo?.slice(0, 3).map(uid => {
                        const name = getUserName(uid);
                        return (
                          <div
                            key={uid}
                            className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs border"
                          >
                            {getInitial(name)}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}

              </div>

            </div>
          ))}

        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {view === "LIST" && (
        <div className="bg-white border rounded-xl overflow-hidden">

          <div className="grid grid-cols-6 px-4 py-2 text-xs text-gray-500 border-b">
            <span>Task</span>
            <span>Project</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due</span>
          </div>

          {filtered.map(task => (
            <div
              key={task.id}
              className="grid grid-cols-6 px-4 py-3 text-sm border-b hover:bg-gray-50"
            >
              <span>{task.taskName}</span>
              <span>{getProjectName(task.projectId)}</span>
              <span>{getUserName(task.taskAssignedTo?.[0])}</span>
              <span>{task.priority}</span>
              <span>{task.taskStatus}</span>
              <span>{task.taskDueDate || "-"}</span>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}