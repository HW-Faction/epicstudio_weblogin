import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const WORKING_MODELS = [
  "Labour",
  "Labour + Material",
  "Material only",
  "Other",
];

export default function VendorModal({
  isOpen,
  onClose,
  editingVendor,
  refresh,
}) {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [form, setForm] = useState({
    vendorName: "",
    vendorPhoneNumber: "",
    vendorCity: "",
    vendorCategory: "",
    vendorWorkingModel: "",
    vendorStatus: "",
    vendorRemarks: "",
  });

  // 🔥 FETCH CATEGORIES
  const fetchCategories = async () => {
    const snap = await getDocs(collection(db, "categories"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setCategories(list);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔥 LOAD EDIT
  useEffect(() => {
    if (editingVendor) {
      setForm({
        vendorName: editingVendor.vendorName || "",
        vendorPhoneNumber: editingVendor.vendorPhoneNumber || "",
        vendorCity: editingVendor.vendorCity || "",
        vendorCategory: editingVendor.vendorCategory || "",
        vendorWorkingModel: editingVendor.vendorWorkingModel || "",
        vendorStatus: editingVendor.vendorStatus || "",
        vendorRemarks: editingVendor.vendorRemarks || "",
      });
    } else {
      setForm({
        vendorName: "",
        vendorPhoneNumber: "",
        vendorCity: "",
        vendorCategory: "",
        vendorWorkingModel: "",
        vendorStatus: "",
        vendorRemarks: "",
      });
    }
  }, [editingVendor]);

  if (!isOpen) return null;

  // 🔥 SAVE VENDOR
  const handleSave = async () => {
    const payload = {
      vendorId: editingVendor?.vendorId || Date.now().toString(),
      vendorName: form.vendorName,
      vendorPhoneNumber: form.vendorPhoneNumber,
      vendorCity: form.vendorCity,
      vendorCategory: form.vendorCategory,
      vendorWorkingModel: form.vendorWorkingModel,
      vendorStatus: form.vendorStatus,
      vendorRemarks: form.vendorRemarks,
      vendorCreatedBy: user?.uid || "",
      vendorCreatedTimeStamp: new Date().toISOString(),
    };

    if (editingVendor) {
      await updateDoc(doc(db, "vendors", editingVendor.id), payload);
    } else {
      await addDoc(collection(db, "vendors"), payload);
    }

    refresh();
    onClose();
  };

  // 🔥 ADD CATEGORY
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    await addDoc(collection(db, "categories"), {
      categoryName: newCategory,
    });

    setNewCategory("");
    setShowCategoryModal(false);
    fetchCategories();
  };

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
        <div className="bg-white w-[600px] rounded p-6">

          <h2 className="text-xl font-bold mb-4">
            {editingVendor ? "Edit Vendor" : "New Vendor"}
          </h2>

          <input
            placeholder="Vendor Name"
            className="border p-2 w-full mb-2"
            value={form.vendorName}
            onChange={(e) =>
              setForm({ ...form, vendorName: e.target.value })
            }
          />

          <input
            placeholder="Phone Number"
            className="border p-2 w-full mb-2"
            value={form.vendorPhoneNumber}
            onChange={(e) =>
              setForm({ ...form, vendorPhoneNumber: e.target.value })
            }
          />

          <input
            placeholder="City"
            className="border p-2 w-full mb-2"
            value={form.vendorCity}
            onChange={(e) =>
              setForm({ ...form, vendorCity: e.target.value })
            }
          />

          {/* CATEGORY DROPDOWN */}
          <select
            className="border p-2 w-full mb-2"
            value={form.vendorCategory}
            onChange={(e) => {
              if (e.target.value === "ADD_NEW") {
                setShowCategoryModal(true);
              } else {
                setForm({ ...form, vendorCategory: e.target.value });
              }
            }}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.categoryName}>
                {c.categoryName}
              </option>
            ))}
            <option value="ADD_NEW">+ Add New Category</option>
          </select>

          {/* WORKING MODEL DROPDOWN */}
          <select
            className="border p-2 w-full mb-2"
            value={form.vendorWorkingModel}
            onChange={(e) =>
              setForm({ ...form, vendorWorkingModel: e.target.value })
            }
          >
            <option value="">Select Working Model</option>
            {WORKING_MODELS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>

          <input
            placeholder="Status"
            className="border p-2 w-full mb-2"
            value={form.vendorStatus}
            onChange={(e) =>
              setForm({ ...form, vendorStatus: e.target.value })
            }
          />

          <textarea
            placeholder="Remarks"
            className="border p-2 w-full mb-4"
            value={form.vendorRemarks}
            onChange={(e) =>
              setForm({ ...form, vendorRemarks: e.target.value })
            }
          />

          <div className="flex justify-end gap-3">
            <button onClick={onClose}>Cancel</button>
            <button
              onClick={handleSave}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[400px] rounded p-6">

            <h3 className="text-lg font-semibold mb-3">
              Add Category
            </h3>

            <input
              placeholder="Category Name"
              className="border p-2 w-full mb-4"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCategoryModal(false)}>
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}