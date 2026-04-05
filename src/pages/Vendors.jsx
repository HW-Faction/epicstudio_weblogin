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

export default function Vendors() {
  const { user, dbUser } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const role = dbUser?.role || "EMPLOYEE";
  const uid = user?.uid;

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  // 🔥 FETCH VENDORS
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

  // 🔥 FILTER
  useEffect(() => {
    let data = [...vendors];

    if (search) {
      data = data.filter(
        (v) =>
          v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
          v.vendorPhoneNumber?.includes(search) ||
          v.vendorCity?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(data);
  }, [vendors, search]);

  // 🔥 DELETE
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "vendors", id));
    fetchVendors();
  };

  return (
    <div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            Vendors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} total vendors
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingVendor(null);
              setModalOpen(true);
            }}
            className="bg-primary text-white px-5 py-2 rounded-lg shadow hover:opacity-90 transition"
          >
            + New Vendor
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="flex gap-3 mb-5">
        <input
          placeholder="Search vendors..."
          className="border rounded-lg px-4 py-2 w-full shadow-sm focus:ring-2 focus:ring-primary outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">City</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Working Model</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t hover:bg-gray-50">

                <td className="p-4 font-semibold">{v.vendorName}</td>
                <td className="p-4">{v.vendorPhoneNumber}</td>
                <td className="p-4">{v.vendorCity}</td>
                <td className="p-4">{v.vendorCategory}</td>
                <td className="p-4">{v.vendorWorkingModel}</td>
                <td className="p-4">{v.vendorStatus}</td>

                <td className="p-4 flex gap-3">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setEditingVendor(v);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(v.id)}
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
      <VendorModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVendor(null);
        }}
        editingVendor={editingVendor}
        refresh={fetchVendors}
      />

    </div>
  );
}