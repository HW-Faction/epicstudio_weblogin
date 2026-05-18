import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

import NavigationHeader from "../components/NavigationHeader";

const STATUS = ["Not Started", "In Progress", "Completed"];
const PRIORITY = ["LOW", "MEDIUM", "HIGH"];

export default function Tasks() {
  const { user, dbUser } = useAuth();

  const role = dbUser?.role || "EMPLOYEE";
  const uid = user?.uid;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  const [tasks, setTasks] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const emptyTask = {
    taskName: "",
    taskCategory: "",
    taskDueDate: "",
    taskStatus: "Not Started",
    taskAssignedTo: [],
    taskReviewer: "",
    reviewerState: "",
    taskCreatedBy: uid || "",
    taskCreatedTimestamp: "",
    taskDescription: "",
    taskFiles: [],
    projectId: "",
    priority: "medium",
  };

  const [form, setForm] = useState(emptyTask);
  const [view, setView] = useState("LIST");

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

  const openAdd = () => {
  setEditingTask(null);
  setForm({
    ...emptyTask,
    taskCreatedBy: uid || "",
    taskCreatedTimestamp: Date.now().toString(),
  });
  setShowModal(true);
};

const openEdit = (task) => {
  setEditingTask(task);
  setForm({
    ...emptyTask,
    ...task,
    taskAssignedTo: task.taskAssignedTo || [],
  });
  setShowModal(true);
};

const saveTask = async () => {
  if (!form.taskName.trim()) return;

  const payload = {
    ...form,
    taskUpdatedAt: Date.now(),
  };

  if (editingTask) {
    await updateDoc(doc(db, "tasks", editingTask.id), payload);
  } else {
    await addDoc(collection(db, "tasks"), payload);
  }

  setShowModal(false);
  setEditingTask(null);
  fetchAll();
};

const toggleUser = (id) => {
  const exists = form.taskAssignedTo.includes(id);

  if (exists) {
    setForm({
      ...form,
      taskAssignedTo: form.taskAssignedTo.filter(u => u !== id),
    });
  } else {
    setForm({
      ...form,
      taskAssignedTo: [...form.taskAssignedTo, id],
    });
  }
};

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader title="Tasks" />

      {/* VIEW SWITCH */}
      <div className="flex justify-between">
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
        <button
                  onClick={openAdd}
                  className="w-28 bg-primary text-white py-1 rounded-lg text-sm"
                >
                 + Add Task
                </button>

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
                    onClick={() => openEdit(task)}
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
            <span className="text-start">Task</span>
            <span className="text-center">Project</span>
            <span className="text-center">Assignee</span>
            <span className="text-center">Priority</span>
            <span className="text-center">Status</span>
            <span className="text-center">Due</span>
          </div>

          {filtered.map(task => (
            <div
              key={task.id}
              onClick={() => openEdit(task)}
              className="grid grid-cols-6 px-4 py-3 text-sm border-b hover:bg-gray-50"
            >
              <span>{task.taskName}</span>
              <span className="text-center">{ getProjectName(task.projectId) == "No Project" ? "-" : getProjectName(task.projectId) }</span>
              <span className="text-center">{getUserName(task.taskAssignedTo?.[0])}</span>
              <span
                className={`px-2 py-1 text-xs rounded-md text-center font-medium ${
                  task.priority?.toLowerCase() === "high"
                    ? "bg-red-300 text-black"
                    : task.priority?.toLowerCase() === "medium"
                    ? "bg-yellow-300 text-black"
                    : "bg-green-300 text-black"
                }`}
              >
                {task.priority?.toUpperCase()}
              </span>
              <span className="text-center">{task.taskStatus}</span>
              <span className="text-center">{task.taskDueDate || "-"}</span>
            </div>
          ))}

        </div>
      )}


      {showModal && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4">

      <h2 className="text-lg font-semibold">
        {editingTask ? "Edit Task" : "Add Task"}
      </h2>

      {/* NAME */}
      <input
        placeholder="Task name"
        className="w-full border rounded-lg px-3 py-2"
        value={form.taskName}
        onChange={(e) =>
          setForm({ ...form, taskName: e.target.value })
        }
      />

      {/* CATEGORY */}
      <input
        placeholder="Category"
        className="w-full border rounded-lg px-3 py-2"
        value={form.taskCategory}
        onChange={(e) =>
          setForm({ ...form, taskCategory: e.target.value })
        }
      />

      {/* DESCRIPTION */}
      <textarea
        placeholder="Description"
        rows={4}
        className="w-full border rounded-lg px-3 py-2"
        value={form.taskDescription}
        onChange={(e) =>
          setForm({ ...form, taskDescription: e.target.value })
        }
      />

      <div className="grid grid-cols-2 gap-4">

        {/* DUE DATE */}
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          value={form.taskDueDate}
          onChange={(e) =>
            setForm({ ...form, taskDueDate: e.target.value })
          }
        />

        {/* PROJECT */}
        <select
          className="border rounded-lg px-3 py-2"
          value={form.projectId}
          onChange={(e) =>
            setForm({ ...form, projectId: e.target.value })
          }
        >
          <option value="">No Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>

        {/* STATUS */}
        <select
          className="border rounded-lg px-3 py-2"
          value={form.taskStatus}
          onChange={(e) =>
            setForm({ ...form, taskStatus: e.target.value })
          }
        >
          {STATUS.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* PRIORITY */}
        <select
          className="border rounded-lg px-3 py-2"
          value={form.priority}
          onChange={(e) =>
            setForm({ ...form, priority: e.target.value })
          }
        >
          {PRIORITY.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>

      </div>

      {/* ASSIGNED USERS */}
      <div>
        <p className="text-sm font-medium mb-2">
          Assign Users
        </p>

        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-xl p-3">

          {users.map(u => (
            <label key={u.id} className="flex gap-2 text-sm">

              <input
                type="checkbox"
                checked={form.taskAssignedTo.includes(u.id)}
                onChange={() => toggleUser(u.id)}
              />

              {u.name}

            </label>
          ))}

        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 pt-4">

        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={saveTask}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Save
        </button>

      </div>

    </div>
  </div>
)}

    </div>
  );
}