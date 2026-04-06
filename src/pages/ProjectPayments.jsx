import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebase";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const SOURCES = ["Cash", "Bank", "CompanyAccount"];

export default function ProjectPayments() {
  const { id } = useParams();

  const [tab, setTab] = useState("FUNDS");

  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [categoryModal, setCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [form, setForm] = useState({});

  // 🔥 FETCH
  const fetchAll = async () => {
    const getList = async (path) => {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    };

    const [f, e, c, v] = await Promise.all([
      getList(`projects/${id}/funds`),
      getList(`projects/${id}/expenses`),
      getList(`projects/${id}/fundCategories`),
      getList(`vendors`),
    ]);

    setFunds(f);
    setExpenses(e);
    setCategories(c);
    setVendors(v);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🔥 TOTALS
  const totalFunds = funds.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalFunds - totalExpenses;

  // 🔥 FILTER
  const data = (tab === "FUNDS" ? funds : expenses).filter((item) => {
    const matchSearch =
      !search ||
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      !filterCategory ||
      (tab === "FUNDS"
        ? item.fundCategory === filterCategory
        : item.expenseCategory === filterCategory);

    return matchSearch && matchCategory;
  });

  // 🔥 ADD CATEGORY
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    await addDoc(collection(db, `projects/${id}/fundCategories`), {
      label: newCategory,
    });

    setNewCategory("");
    setCategoryModal(false);
    fetchAll();
  };

  // 🔥 SAVE
  const handleSave = async () => {
  let attachments = [];

  // keep old attachments if editing
  if (editing) {
    attachments =
      tab === "FUNDS"
        ? editing.fundReceipt || []
        : editing.expenseReceipt || [];
  }

  // upload new files
  if (form.files?.length) {
    for (let file of form.files) {
      const path = `projects/${id}/${tab.toLowerCase()}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      attachments.push({
        url,
        fileName: file.name,
        type: file.type.includes("pdf") ? "pdf" : "image",
        size: file.size,
      });
    }
  }

  const payload =
    tab === "FUNDS"
      ? {
          ...form,
          fundReceipt: attachments,
        }
      : {
          ...form,
          expenseReceipt: attachments,
        };

  // remove temp field
  delete payload.files;

  const path = `projects/${id}/${tab.toLowerCase()}`;

  if (editing) {
    await updateDoc(doc(db, path, editing.id), payload);
  } else {
    await addDoc(collection(db, path), payload);
  }

  setModalOpen(false);
  setForm({});
  setEditing(null);

  fetchAll();
};

  // 🔥 DELETE
  const handleDelete = async (item) => {
    if (!window.confirm("Delete?")) return;

    await deleteDoc(
      doc(db, `projects/${id}/${tab.toLowerCase()}`, item.id)
    );

    fetchAll();
  };

  return (
    <div className="p-6 space-y-6">

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  {/* FUNDS */}
  <div className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">Funds</span>
      <span className="text-green-600 text-lg">💰</span>
    </div>

    <h2 className="text-2xl font-semibold text-green-600">
      ₹ {totalFunds}
    </h2>

    <p className="text-xs text-gray-400 mt-1">
      Total incoming funds
    </p>
  </div>

  {/* EXPENSES */}
  <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">Expenses</span>
      <span className="text-red-500 text-lg">💸</span>
    </div>

    <h2 className="text-2xl font-semibold text-red-500">
      ₹ {totalExpenses}
    </h2>

    <p className="text-xs text-gray-400 mt-1">
      Total spending
    </p>
  </div>

  {/* BALANCE */}
  <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-500">Balance</span>
      <span className="text-blue-600 text-lg">📊</span>
    </div>

    <h2
      className={`text-2xl font-semibold ${
        balance >= 0 ? "text-blue-600" : "text-red-500"
      }`}
    >
      ₹ {balance}
    </h2>

    <p className="text-xs text-gray-400 mt-1">
      Remaining amount
    </p>
  </div>

</div>

      {/* TABS */}
      <div className="flex gap-6 border-b">
        {["FUNDS", "EXPENSES"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${
              tab === t
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        <input
          placeholder="Search..."
          className="border p-2 w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id}>{c.label}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setEditing(null);
            setForm({});
            setModalOpen(true);
          }}
          className="bg-primary text-white px-4"
        >
          + Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">

  {data.map((item) => (
    <div
      key={item.id}
      className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition flex justify-between gap-6"
    >

      {/* LEFT SECTION */}
      <div className="flex-1">

        {/* TOP ROW */}
        <div className="flex items-center mb-2">
         <h2
  className={`text-xl font-semibold ${
    tab === "FUNDS" ? "text-green-600" : "text-red-600"
  }`}
>
  ₹ {item.amount || "-"}
</h2>

          <span className="text-xs text-gray-500 ms-4">
            {item.transactionDate || "-"}
          </span>
        </div>

        {/* TAGS */}
        <div className="flex flex-wrap gap-2 mb-2 text-xs">

          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            {item.fundCategory || item.expenseCategory || "No Category"}
          </span>

          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {item.fundSource || item.expenseSource || "No Source"}
          </span>

          {item.vendor && (
            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
              {item.vendor}
            </span>
          )}

        </div>

        {/* REMARK */}
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {item.fundRemarks || item.expenseRemarks || "No remarks"}
        </p>

        {/* ATTACHMENTS */}
        {(item.fundReceipt || item.expenseReceipt)?.length > 0 && (
          <div className="flex flex-wrap gap-2">

            {(item.fundReceipt || item.expenseReceipt).map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                className="flex items-center gap-1 text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
              >
                {file.type === "pdf" ? "📄" : "🖼️"}
                {file.fileName.length > 15
                  ? file.fileName.slice(0, 15) + "..."
                  : file.fileName}
              </a>
            ))}

          </div>
        )}

      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex flex-col justify-between items-end">

        <div className="text-xs text-gray-400">
          ID: {item.id}
        </div>

        <div className="flex gap-3 text-sm">

          <button
            onClick={() => {
              setEditing(item);
              setForm(item);
              setModalOpen(true);
            }}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(item)}
            className="text-red-500 hover:underline"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  ))}

</div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 w-[500px] rounded">

            <input
              type="date"
              className="border p-2 w-full mb-2"
              disabled={editing}
              value={form.transactionDate || ""}
              onChange={(e) =>
                setForm({ ...form, transactionDate: e.target.value })
              }
            />

            <input
              placeholder="Amount"
              className="border p-2 w-full mb-2"
              disabled={editing}
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
            />

            {/* SOURCE */}
            <select
              className="border p-2 w-full mb-2"
              value={tab === "FUNDS" ? form.fundSource : form.expenseSource}
              onChange={(e) =>
                setForm({
                  ...form,
                  [tab === "FUNDS" ? "fundSource" : "expenseSource"]: e.target.value,
                })
              }
            >
              <option value="">Select Source</option>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {/* VENDOR (EXPENSE ONLY) */}
            {tab === "EXPENSES" && (
              <select
                className="border p-2 w-full mb-2"
                value={form.vendor || ""}
                onChange={(e) =>
                  setForm({ ...form, vendor: e.target.value })
                }
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id}>{v.vendorName}</option>
                ))}
              </select>
            )}

            {/* CATEGORY */}
            <select
              className="border p-2 w-full mb-2"
              value={
                tab === "FUNDS"
                  ? form.fundCategory
                  : form.expenseCategory
              }
              onChange={(e) => {
                if (e.target.value === "ADD_NEW") {
                  setCategoryModal(true);
                } else {
                  setForm({
                    ...form,
                    [tab === "FUNDS"
                      ? "fundCategory"
                      : "expenseCategory"]: e.target.value,
                  });
                }
              }}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
              {tab === "FUNDS" && <option value="ADD_NEW">+ Add Category</option>}
            </select>

            {/* REMARK */}
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Remarks"
              value={form.fundRemarks || form.expenseRemarks || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  [tab === "FUNDS"
                    ? "fundRemarks"
                    : "expenseRemarks"]: e.target.value,
                })
              }
            />

            {/* FILE */}
            <input
              type="file"
              multiple
              className="mb-3"
              onChange={(e) =>
  setForm({
    ...form,
    files: Array.from(e.target.files),
  })
}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button onClick={handleSave} className="bg-primary text-white px-4">
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-5 rounded w-[300px]">

            <input
              className="border p-2 w-full mb-3"
              placeholder="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <button
              onClick={handleAddCategory}
              className="bg-primary text-white px-4"
            >
              Add
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

// UI
const Stat = ({ label, value }) => (
  <div className="bg-white p-4 rounded shadow text-center">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);