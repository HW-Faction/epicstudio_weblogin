import { useEffect, useState } from "react";
import { db } from "../firebase";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import NavigationHeader from "../components/NavigationHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";

const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE", "CLIENT"];
const STATUS = ["ACTIVE", "DISABLED"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sort, setSort] = useState("newest");

  const [hoveredRow, setHoveredRow] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  // 🔥 FETCH
  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setUsers(list);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔥 FILTER + SORT
  useEffect(() => {
    let data = [...users];

    if (search) {
      data = data.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.number?.includes(search)
      );
    }

    if (roleFilter) {
      data = data.filter((u) => u.role === roleFilter);
    }

    if (statusFilter) {
      data = data.filter((u) => u.status === statusFilter);
    }

    if (sort === "name") {
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    if (sort === "newest") {
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    setFiltered(data);
  }, [users, search, roleFilter, statusFilter, sort]);

  // 🔥 UPDATE ROLE
  const updateRole = async (userId, role) => {
    await updateDoc(doc(db, "users", userId), { role });

    setSnackbar({ type: "success", message: "Role updated" });
    fetchUsers();
  };

  // 🔥 TOGGLE STATUS
  const toggleStatus = async (u) => {
    const newStatus = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    await updateDoc(doc(db, "users", u.id), {
      status: newStatus,
    });

    setSnackbar({
      type: newStatus === "ACTIVE" ? "success" : "error",
      message: `User ${newStatus}`,
    });

    fetchUsers();
  };

  // 🔥 DELETE
  const handleDelete = async () => {
    if (!confirm) return;

    await deleteDoc(doc(db, "users", confirm.id));

    setSnackbar({ type: "error", message: "User deleted" });
    setConfirm(null);
    fetchUsers();
  };

  // 🔥 HELPERS
  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-600";
      case "MANAGER":
        return "bg-blue-50 text-blue-600";
      case "EMPLOYEE":
        return "bg-gray-100 text-gray-700";
      case "CLIENT":
        return "bg-green-50 text-green-600";
      default:
        return "bg-gray-50";
    }
  };

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const disabledCount = users.filter((u) => u.status === "DISABLED").length;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <NavigationHeader
        title="Users"
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
      />

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Stat label="Total Users" value={users.length} />
        <Stat label="Active" value={activeCount} color="green" />
        <Stat label="Disabled" value={disabledCount} color="red" />
        <Stat label="Admins" value={users.filter(u => u.role === "ADMIN").length} color="purple" />

      </div>

      {/* FILTERS */}
      <div className="flex gap-3 items-center">

        <input
          placeholder="Search users..."
          className="border px-4 py-2 rounded-lg w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded-lg"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>

        <select
          className="border px-3 py-2 rounded-lg"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          className="border px-3 py-2 rounded-lg"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-center">Contact</th>
              <th className="p-4 text-center">Role</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                onMouseEnter={() => setHoveredRow(u.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className="border-t hover:bg-gray-50 transition"
              >

                {/* USER */}
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                    {getInitial(u.name)}
                  </div>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </td>

                {/* CONTACT */}
                <td className="p-4 text-gray-600 text-center">
                  {u.number || "-"}
                </td>

                {/* ROLE */}
                <td className="p-4 text-center">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateRole(u.id, e.target.value)
                    }
                    className={`px-2 py-1 rounded text-xs ${getRoleColor(u.role)}`}
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>

                {/* STATUS */}
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={`px-2 py-1 rounded-full text-xs ${
                      u.status === "ACTIVE"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {u.status || "ACTIVE"}
                  </button>
                </td>

                {/* ACTIONS */}
                <td className="p-4 text-center">
                 <button
                      onClick={() => setConfirm(u)}
                      className="text-red-500 text-sm"
                    >
                      Delete
                    </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* CONFIRM */}
      {confirm !== null && (
        <ConfirmDialog
            open={true}
            title="Delete User"
            description="This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
        />
        )}

      {/* SNACKBAR */}
      <Snackbar data={snackbar} />

    </div>
  );
}

/* ================= UI ================= */

const Stat = ({ label, value, color = "gray" }) => {
  const colors = {
    gray: "text-gray-700 bg-gray-50 border-gray-200",
    green: "text-green-600 bg-green-50 border-green-100",
    red: "text-red-500 bg-red-50 border-red-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
  };

  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <p className="text-xs">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
};