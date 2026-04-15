// ================= PROJECT MILESTONES (FINAL CLEAN VERSION) =================
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";
import Modal from "../components/Modal";

const STATUS = ["Not Started", "In Progress", "Completed"];

export default function ProjectMilestones() {
  const { id } = useParams();
  const { user } = useAuth();

  const [milestones, setMilestones] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [openScopes, setOpenScopes] = useState({});

  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [snackbar, setSnackbar] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [scopes, setScopes] = useState([]);
  const [scopeModal, setScopeModal] = useState(false);
  const [newScope, setNewScope] = useState("");


  const [form, setForm] = useState({
    milestoneTitle: "",
    milestoneScope: "",
    milestoneStatus: "In Progress",
    milestoneProgress: "",
    milestoneStartDate: "",
    milestoneEndDate: "",
    assignedTo: [],
    lastUpdateRemark: "",
  });

  // ===== FETCH =====
  const fetchAll = async () => {
    const [mSnap, uSnap] = await Promise.all([
      getDocs(collection(db, "projects", id, "milestones")),
      getDocs(collection(db, "users")),
    ]);

    setMilestones(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const m = mSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const uniqueScopes = [
      ...new Set(m.map((m) => m.milestoneScope).filter(Boolean)),
    ];
    setScopes(uniqueScopes);
  };

  useEffect(() => { fetchAll(); }, []);

  // ===== FILTER + GROUP =====
  useEffect(() => {
    let data = [...milestones];

    if (search) {
      data = data.filter(m =>
        m.milestoneTitle?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      data = data.filter(m => m.milestoneStatus === statusFilter);
    }

    const groupedData = {};
    data.forEach(m => {
      if (!groupedData[m.milestoneScope]) groupedData[m.milestoneScope] = [];
      groupedData[m.milestoneScope].push(m);
    });

    setGrouped(groupedData);
  }, [milestones, search, statusFilter]);

  // ===== STATS =====
  const total = milestones.length;
  const completed = milestones.filter(m => m.milestoneStatus === "Completed").length;
  const inProgress = milestones.filter(m => m.milestoneStatus === "In Progress").length;
  const notStarted = milestones.filter(m => m.milestoneStatus === "Not Started").length;

  // ===== HELPERS =====
  const getUserName = uid => users.find(u => u.id === uid)?.name || "";
  const getInitial = name => name?.charAt(0)?.toUpperCase() || "?";

  const toggleScope = (scope) => {
    setOpenScopes(prev => ({
      ...prev,
      [scope]: !prev[scope],
    }));
  };

  // ===== OPEN MODAL =====
  const openNew = () => {
    setEditing(null);
    setForm({
      milestoneTitle: "",
      milestoneScope: "",
      milestoneStatus: "In Progress",
      milestoneProgress: "",
      milestoneStartDate: "",
      milestoneEndDate: "",
      assignedTo: [],
      lastUpdateRemark: "",
    });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ ...m, assignedTo: m.assignedTo || [] });
    setModalOpen(true);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    const payload = {
      ...form,
      milestoneCreatedBy: user?.uid || "",
      milestoneCreatedTimestamp: Date.now(),
    };

    if (editing) {
      await updateDoc(doc(db, "projects", id, "milestones", editing.id), payload);
      setSnackbar({ type: "success", message: "Updated" });
    } else {
      await addDoc(collection(db, "projects", id, "milestones"), payload);
      setSnackbar({ type: "success", message: "Added" });
    }

    setModalOpen(false);
    fetchAll();
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    await deleteDoc(doc(db, "projects", id, "milestones", confirm.id));
    setConfirm(null);
    setSnackbar({ type: "error", message: "Deleted" });
    fetchAll();
  };

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader
        title="Milestones"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: `Project (${id})` },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Total" value={total} />
        <Stat label="Completed" value={completed} />
        <Stat label="In Progress" value={inProgress} />
        <Stat label="Not Started" value={notStarted} />
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        <input
          placeholder="Search..."
          className="border rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>

        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg">
          + Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {Object.keys(grouped).map(scope => (
          <div key={scope} className="border rounded-xl overflow-hidden bg-white">

            {/* SCOPE HEADER */}
            <div
              className="px-4 py-3 flex justify-between cursor-pointer border-b bg-gray-50"
              onClick={() => toggleScope(scope)}
            >
              <span className="font-medium">{scope}</span>
              <span>{openScopes[scope] ? "−" : "+"}</span>
            </div>

            {openScopes[scope] && (
              <>
                {/* TABLE HEADER */}
                <div className="grid grid-cols-7 px-4 py-2 text-xs text-gray-500 border-b">
                  <span>Title</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Progress</span>
                  <span className="text-center">Start</span>
                  <span className="text-center">End</span>
                  <span className="text-center">Assigned</span>
                  <span className="text-right">Actions</span>
                </div>

                {grouped[scope].map(m => (
                  <div key={m.id} className="group grid grid-cols-7 px-4 py-3 border-b hover:bg-gray-50">

                    <span className="font-medium">{m.milestoneTitle}</span>
                    <span className="text-center">{m.milestoneStatus}</span>
                    <div className="w-full text-center pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-100 h-2 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${m.milestoneProgress || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">
                          {m.milestoneProgress || 0}%
                        </span>
                      </div>
                    </div>
                    <span className="text-center">{m.milestoneStartDate || "-"}</span>
                    <span className="text-center">{m.milestoneEndDate || "-"}</span>

                    <div className="flex justify-center">
                      <div className="flex -space-x-1">
                        {m.assignedTo?.map(uid => {
                          const name = getUserName(uid);
                          return (
                            <div key={uid} className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs border border-white">
                              {getInitial(name)}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(m)} className="text-blue-600 text-xs">Edit</button>
                      <button onClick={() => setConfirm(m)} className="text-red-500 text-xs">Delete</button>
                    </div>

                  </div>
                ))}
              </>
            )}

          </div>
        ))}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <Modal title={editing ? "Edit Milestone" : "New Milestone"} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-2 gap-3">

            <input
              placeholder="Title"
              className="border p-2 col-span-2"
              value={form.milestoneTitle}
              onChange={(e) => setForm({ ...form, milestoneTitle: e.target.value })}
            />

            <div className="flex col-span-2">

              <select
                className="border p-2 w-full"
                value={form.milestoneScope}
                onChange={(e) => setForm({ ...form, milestoneScope: e.target.value })}
              >
                <option value="">Select Scope</option>
                {scopes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() => setScopeModal(true)}
                className="px-3 bg-gray-100 rounded"
              >
                +
              </button>

            </div>

            <select
              className="border p-2"
              value={form.milestoneStatus}
              onChange={(e) => setForm({ ...form, milestoneStatus: e.target.value })}
            >
              {STATUS.map(s => <option key={s}>{s}</option>)}
            </select>

            <input
              placeholder="Progress %"
              className="border p-2"
              value={form.milestoneProgress}
              onChange={(e) => setForm({ ...form, milestoneProgress: e.target.value })}
            />

            <input
              type="date"
              className="border p-2"
              value={form.milestoneStartDate}
              onChange={(e) => setForm({ ...form, milestoneStartDate: e.target.value })}
            />

            <input
              type="date"
              className="border p-2"
              value={form.milestoneEndDate}
              onChange={(e) => setForm({ ...form, milestoneEndDate: e.target.value })}
            />

            <textarea
              placeholder="Remarks"
              className="border p-2 col-span-2"
              value={form.lastUpdateRemark}
              onChange={(e) => setForm({ ...form, lastUpdateRemark: e.target.value })}
            />

          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setModalOpen(false)}>Cancel</button>
            <button onClick={handleSave} className="bg-primary text-white px-4 py-2">
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* CONFIRM */}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* SNACKBAR */}
      {snackbar && <Snackbar data={snackbar} />}

      {scopeModal && (
        <Modal title="Add Scope" onClose={() => setScopeModal(false)}>
          <div className="space-y-3">

            <input
              placeholder="Scope name"
              className="border p-2 w-full"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setScopeModal(false)}>Cancel</button>

              <button
                onClick={() => {
                  if (!newScope.trim()) return;

                  const scope = newScope.trim();

                  if (!scopes.includes(scope)) {
                    setScopes((prev) => [...prev, scope]);
                  }

                  setForm((prev) => ({
                    ...prev,
                    milestoneScope: scope,
                  }));

                  setNewScope("");
                  setScopeModal(false);
                }}
                className="bg-primary text-white px-4 py-2"
              >
                Add
              </button>

            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="border rounded-xl p-4 bg-white">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);