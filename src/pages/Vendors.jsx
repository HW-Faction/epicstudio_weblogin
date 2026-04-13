import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import VendorModal from "../components/VendorModal";

import NavigationHeader from "../components/NavigationHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";

export default function Vendors() {
  const { user, dbUser } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const role = dbUser?.role || "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // ===== FETCH =====
  const fetchVendors = async () => {
    const snap = await getDocs(collection(db, "vendors"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setVendors(list);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // ===== FILTER + SORT =====
  useEffect(() => {
    let data = [...vendors];

    // SEARCH
    if (search) {
      data = data.filter(
        (v) =>
          v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
          v.vendorPhoneNumber?.includes(search) ||
          v.vendorCity?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // CATEGORY
    if (categoryFilter) {
      data = data.filter((v) => v.vendorCategory === categoryFilter);
    }

    // STATUS
    if (statusFilter) {
      data = data.filter((v) => v.vendorStatus === statusFilter);
    }

    // SORT
    data.sort((a, b) => {
      if (sortBy === "city") {
        return a.vendorCity.localeCompare(b.vendorCity);
      }
      return a.vendorName.localeCompare(b.vendorName);
    });

    setFiltered(data);
  }, [vendors, search, categoryFilter, statusFilter, sortBy]);

  // ===== DELETE =====
  const handleDelete = async () => {
    await deleteDoc(doc(db, "vendors", confirm.id));
    setConfirm(null);
    setSnackbar({ type: "error", message: "Deleted" });
    fetchVendors();
  };

  // ===== UNIQUE VALUES FOR FILTERS =====
  const categories = [...new Set(vendors.map((v) => v.vendorCategory).filter(Boolean))];
  const statuses = [...new Set(vendors.map((v) => v.vendorStatus).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader title="Vendors" rightContent={
        <div className="flex justify-between items-center">
        <p className="text-md text-sky-900 mr-4">
          Total :  {filtered.length} vendors
        </p>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingVendor(null);
              setModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
          >
            + New Vendor
          </button>
        )}
      </div>
      } />

      {/* HEADER */}
      

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">

        {/* SEARCH */}
        <input
          placeholder="Search vendors..."
          className="border rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* CATEGORY */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c, i) => (
            <option key={i}>{c}</option>
          ))}
        </select>

        {/* STATUS */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {statuses.map((s, i) => (
            <option key={i}>{s}</option>
          ))}
        </select>

        {/* SORT */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="city">Sort by City</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="grid grid-cols-7 px-4 py-2 text-xs text-gray-500 border-b">
          <span className="text-start">Name</span>
          <span className="text-center">Phone</span>
          <span className="text-center">City</span>
          <span className="text-center">Category</span>
          <span className="text-center">Working Model</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.map((v) => (
          <div
            key={v.id}
            className="group grid grid-cols-7 px-4 py-3 text-sm items-center border-b hover:bg-gray-50"
          >
            <span className="font-medium text-start">{v.vendorName}</span>
            <span className="text-center">{v.vendorPhoneNumber}</span>
            <span className="text-center">{v.vendorCity}</span>
            <span className="text-center">{v.vendorCategory}</span>
            <span className="text-center">{v.vendorWorkingModel}</span>

            {/* STATUS BADGE */}
             <span className="px-2 py-1 text-xs rounded-lg text-center bg-gray-300">
                { v.vendorStatus.length !== 0 ? v.vendorStatus : "-"  }
             </span>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 text-xs">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setEditingVendor(v);
                      setModalOpen(true);
                    }}
                    className="text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setConfirm(v)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

          </div>
        ))}

      </div>

      {/* MODAL */}
      <VendorModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVendor(null);
        }}
        editingVendor={editingVendor}
        refresh={fetchVendors}
      />

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

    </div>
  );
}