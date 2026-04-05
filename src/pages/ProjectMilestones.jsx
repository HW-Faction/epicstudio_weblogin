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

const STATUS = ["Not Started", "In Progress", "Completed"];

export default function ProjectMilestones() {
  const { id } = useParams();
  const { user } = useAuth();

  const [milestones, setMilestones] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [openScopes, setOpenScopes] = useState({});

  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [scopeModal, setScopeModal] = useState(false);
  const [scopes, setScopes] = useState([]);
  const [newScope, setNewScope] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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

  // 🔥 FETCH USERS
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setUsers(list);
  };

  // 🔥 FETCH
  const fetchMilestones = async () => {
    const snap = await getDocs(
      collection(db, "projects", id, "milestones")
    );

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const uniqueScopes = [
      ...new Set(list.map((m) => m.milestoneScope).filter(Boolean)),
    ];

    setScopes(uniqueScopes);
    setMilestones(list);
  };

  useEffect(() => {
    fetchMilestones();
    fetchUsers();
  }, []);

  // 🔥 FILTER
  useEffect(() => {
    let data = [...milestones];

    if (search) {
      data = data.filter((m) =>
        m.milestoneTitle?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      data = data.filter((m) => m.milestoneStatus === statusFilter);
    }

    setFiltered(data);
  }, [milestones, search, statusFilter]);

  // 🔥 GROUP BY SCOPE
  useEffect(() => {
    const groupedData = {};

    filtered.forEach((m) => {
      if (!groupedData[m.milestoneScope]) {
        groupedData[m.milestoneScope] = [];
      }
      groupedData[m.milestoneScope].push(m);
    });

    setGrouped(groupedData);
  }, [filtered]);

  useEffect(() => {
  const handleClickOutside = () => setUserDropdownOpen(false);
  window.addEventListener("click", handleClickOutside);
  return () => window.removeEventListener("click", handleClickOutside);
}, []);



  // 🔥 STATS
  const total = milestones.length;
  const completed = milestones.filter((m) => m.milestoneStatus === "Completed").length;
  const inProgress = milestones.filter((m) => m.milestoneStatus === "In Progress").length;
  const notStarted = milestones.filter((m) => m.milestoneStatus === "Not Started").length;

  // 🔥 HELPERS
  const getDaysRemaining = (end) => {
    if (!end) return "-";
    const diff = new Date(end) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUserName = (uid) =>
    users.find((u) => u.id === uid)?.name || "";

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  // 🔥 OPEN/CLOSE
  const toggleScope = (scope) => {
    setOpenScopes((prev) => ({
      ...prev,
      [scope]: !prev[scope],
    }));
  };

  // 🔥 OPEN EDIT
  const openEdit = (m) => {
    setEditing(m);
    setForm({
      ...m,
      assignedTo: m.assignedTo || [],
    });
    setModalOpen(true);
  };

  // 🔥 NEW
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

  // 🔥 SAVE
  const handleSave = async () => {
    const payload = {
      milestoneId: editing?.milestoneId || Date.now().toString(),
      ...form,
      milestoneCreatedBy: user?.uid || "",
      milestoneCreatedTimestamp: Date.now(),
    };

    if (editing) {
      await updateDoc(
        doc(db, "projects", id, "milestones", editing.id),
        payload
      );
    } else {
      await addDoc(
        collection(db, "projects", id, "milestones"),
        payload
      );
    }

    setModalOpen(false);
    fetchMilestones();
  };

  // 🔥 DELETE
  const handleDelete = async (m) => {
    if (!window.confirm("Delete milestone?")) return;

    await deleteDoc(
      doc(db, "projects", id, "milestones", m.id)
    );

    fetchMilestones();
  };

  // 🔥 ADD SCOPE
  const handleAddScope = () => {
    if (!newScope.trim()) return;

    const scope = newScope.trim();

    setScopes((prev) =>
      prev.includes(scope) ? prev : [...prev, scope]
    );

    setForm((prev) => ({
      ...prev,
      milestoneScope: scope,
    }));

    setNewScope("");
    setScopeModal(false);
  };

  return (
    <div className="p-6">

      {/* TITLE */}
      <h1 className="text-2xl font-semibold mb-4">Project Milestones</h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[["Total", total], ["Completed", completed], ["In Progress", inProgress], ["Not Started", notStarted]].map(([l, v]) => (
          <div key={l} className="bg-white p-3 rounded shadow text-center">
            <p className="text-xs text-gray-500">{l}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-5">
        <input
          placeholder="Search..."
          className="border p-2 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button onClick={openNew} className="bg-primary text-white px-4 rounded">
          + Add
        </button>
      </div>

      {/* SCOPES */}
      <div className="space-y-4">
        {Object.keys(grouped).map((scope) => (
          <div key={scope} className="bg-white rounded shadow">

            <div
              className="p-4 cursor-pointer flex justify-between border-b"
              onClick={() => toggleScope(scope)}
            >
              <span>{scope}</span>
              <span>{openScopes[scope] ? "−" : "+"}</span>
            </div>

            {openScopes[scope] && (
              <div className="p-3 space-y-3">

                {grouped[scope].map((m) => (
                  <div key={m.id} className="border p-3 rounded flex justify-between">

                    <div>
                      <p className="font-medium">{m.milestoneTitle}</p>

                      <p className="text-xs text-gray-500">
                        {m.milestoneStartDate} → {m.milestoneEndDate} | {getDaysRemaining(m.milestoneEndDate)} days left
                      </p>

                      <p className="text-xs">
                        {m.milestoneStatus} • {m.milestoneProgress}%
                      </p>
                    </div>

                    {/* USERS */}
                    <div className="flex gap-2 items-center">
                      {m.assignedTo?.map((uid) => (
                        <div
                          key={uid}
                          className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs"
                        >
                          {getInitial(getUserName(uid))}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 text-sm">
                      <button onClick={() => openEdit(m)} className="text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(m)} className="text-red-500">Delete</button>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>
        ))}
      </div>

      


      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[500px] p-6 rounded">

            <h2 className="font-semibold mb-3">
              {editing ? "Edit" : "New"} Milestone
            </h2>

            <input
              placeholder="Title"
              className="border p-2 w-full mb-2"
              value={form.milestoneTitle}
              onChange={(e) =>
                setForm({ ...form, milestoneTitle: e.target.value })
              }
            />

            {/* SCOPE */}
            <select
              className="border p-2 w-full mb-2"
              value={form.milestoneScope}
              onChange={(e) => {
                if (e.target.value === "ADD_NEW") {
                  setScopeModal(true);
                } else {
                  setForm({ ...form, milestoneScope: e.target.value });
                }
              }}
            >
              <option value="">Select Scope</option>
              {scopes.map((s) => (
                <option key={s}>{s}</option>
              ))}
              <option value="ADD_NEW">+ Add Scope</option>
            </select>

            {/* STATUS */}
            <select
              className="border p-2 w-full mb-2"
              value={form.milestoneStatus}
              onChange={(e) =>
                setForm({ ...form, milestoneStatus: e.target.value })
              }
            >
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <input
              placeholder="Progress %"
              className="border p-2 w-full mb-2"
              value={form.milestoneProgress}
              onChange={(e) =>
                setForm({ ...form, milestoneProgress: e.target.value })
              }
            />

            {/* USERS MULTI SELECT */}
            <div className="mb-3 relative">
  <p className="text-sm mb-1">Assign Users</p>

  {/* DROPDOWN BUTTON */}
  <div
    onClick={(e) => {
  e.stopPropagation();
  setUserDropdownOpen(!userDropdownOpen);
}}
    className="border p-2 rounded cursor-pointer flex justify-between items-center"
  >
    <span className="text-sm text-gray-600">
      {form.assignedTo.length > 0
        ? `${form.assignedTo.length} selected`
        : "Select users"}
    </span>
    <span>▾</span>
  </div>

  {/* DROPDOWN PANEL */}
  {userDropdownOpen && (
    <div className="absolute z-50 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>

      {users.map((u) => (
        <label
          key={u.id}
          className="flex items-center gap-2 p-2 hover:bg-gray-50 text-sm"
        >
          <input
            type="checkbox"
            checked={form.assignedTo.includes(u.id)}
            onChange={(e) => {
              const updated = e.target.checked
                ? [...form.assignedTo, u.id]
                : form.assignedTo.filter((id) => id !== u.id);

              setForm({ ...form, assignedTo: updated });
            }}
          />
          {u.name}
        </label>
      ))}

    </div>
  )}
</div>

            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={form.milestoneStartDate}
              onChange={(e) =>
                setForm({ ...form, milestoneStartDate: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={form.milestoneEndDate}
              onChange={(e) =>
                setForm({ ...form, milestoneEndDate: e.target.value })
              }
            />

            <textarea
              placeholder="Last Update Remark"
              className="border p-2 w-full mb-3"
              value={form.lastUpdateRemark}
              onChange={(e) =>
                setForm({ ...form, lastUpdateRemark: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}


      {/* 🔥 ADD SCOPE MODAL */}
       {scopeModal && ( 
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"> 
        <div className="bg-white p-5 rounded w-[350px]"> 
            <h3 className="mb-3 font-medium">Add Scope</h3> 
            <input className="border p-2 w-full mb-3" placeholder="Scope name" value={newScope} onChange={(e) => { 
                setNewScope(e.target.value) 
                scopes = [...scopes, newScope] 
                }} />
                 <div className="flex justify-end gap-3"> 
                    <button onClick={() => setScopeModal(false)}> Cancel </button> <button onClick={handleAddScope} className="bg-primary text-white px-4 py-2 rounded" > Add </button> </div> </div> </div> )}
    </div>
  );
}