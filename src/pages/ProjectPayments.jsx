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
import { IndianRupee, CreditCard } from "lucide-react";


import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";
import Modal from "../components/Modal";

const SOURCES = ["Cash", "Bank", "CompanyAccount"];

export default function ProjectPayments() {
  const { id } = useParams();

  const [tab, setTab] = useState("FUNDS");

  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const [categoryModal, setCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [snackbar, setSnackbar] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // ===== FETCH =====
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

  useEffect(() => { fetchAll(); }, []);

  // ===== TOTALS =====
  const totalFunds = funds.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalFunds - totalExpenses;

  const data = (tab === "FUNDS" ? funds : expenses)
    .filter((item) => {
      const text = JSON.stringify(item).toLowerCase();

      const matchSearch =
        !search || text.includes(search.toLowerCase());

      const matchCategory =
        !filterCategory ||
        (tab === "FUNDS"
          ? item.fundCategory === filterCategory
          : item.expenseCategory === filterCategory);

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let valA, valB;

      if (sortBy === "amount") {
        valA = Number(a.amount || 0);
        valB = Number(b.amount || 0);
      } else {
        valA = new Date(a.transactionDate || 0);
        valB = new Date(b.transactionDate || 0);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

  // ===== SAVE =====
  const handleSave = async () => {
    let attachments = editing
      ? tab === "FUNDS"
        ? editing.fundReceipt || []
        : editing.expenseReceipt || []
      : [];

    if (form.files?.length) {
      for (let file of form.files) {
        const path = `projects/${id}/${tab.toLowerCase()}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        attachments.push({ url, fileName: file.name });
      }
    }

    const payload =
      tab === "FUNDS"
        ? { ...form, fundReceipt: attachments }
        : { ...form, expenseReceipt: attachments };

    delete payload.files;

    const path = `projects/${id}/${tab.toLowerCase()}`;

    if (editing) {
      await updateDoc(doc(db, path, editing.id), payload);
      setSnackbar({ type: "success", message: "Updated" });
    } else {
      await addDoc(collection(db, path), payload);
      setSnackbar({ type: "success", message: "Added" });
    }

    setModalOpen(false);
    setEditing(null);
    setForm({});
    fetchAll();
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    await deleteDoc(doc(db, `projects/${id}/${tab.toLowerCase()}`, confirm.id));
    setConfirm(null);
    setSnackbar({ type: "error", message: "Deleted" });
    fetchAll();
  };

  // ===== ADD CATEGORY =====
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    await addDoc(collection(db, `projects/${id}/fundCategories`), {
      label: newCategory,
    });

    setSnackbar({ type: "success", message: "Category added" });

    setNewCategory("");
    setCategoryModal(false);
    fetchAll();
  };

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader
        title="Payments"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: `Project (${id})` },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Funds" icon={IndianRupee} value={`₹ ${totalFunds}`} color="text-green-600" />
        <Stat label="Expenses" icon={CreditCard}  value={`₹ ${totalExpenses}`} color="text-red-600" />
        <Stat label="Balance" icon={IndianRupee}  value={`₹ ${balance}`}  color="text-gray-600" />
      </div>

      {/* TABS */}
      <div className="flex items-center justify-between">


      {/* CENTER (tabs) */}
        <div className="flex gap-2 items-start">
          {["FUNDS", "EXPENSES"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                tab === t ? "bg-primary text-white" : "bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* RIGHT (button) */}
        <div>
          <button
            onClick={() => {
              setEditing(null);
              setForm({});
              setModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
          >
            + Add Entry
          </button>
        </div>

      </div>


      <div className="flex flex-wrap gap-3 items-center">

        {/* SEARCH */}
        <input
          placeholder="Search..."
          className="border rounded-lg px-3 py-2 text-sm w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* CATEGORY FILTER */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id}>{c.label}</option>
          ))}
        </select>

        {/* SORT BY */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        {/* ORDER */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <button onClick={() => {
          setSearch("");
          setFilterCategory("");
        }} className="ms-4 bg-gray-500 p-1 text-white border border-zinc-500 rounded-lg ps-4 pr-4">
          Clear
        </button>

      </div>
      

      {/* LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">

        <div className="grid grid-cols-6 px-4 py-2 text-xs text-gray-500 border-b">
          <span className="text-start">Entry ID</span>
          <span className="text-center">Amount</span>
          <span className="text-center">Date</span>
          <span className="text-center">Category</span>
          <span className="text-center">Source</span>
          <span className="text-right">Actions</span>
        </div>

        {data.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-6 px-4 py-3 text-sm items-center border-b hover:bg-gray-50"
          >
            <span className="font-medium mr-8">{item.id}</span>
            <span className="font-medium text-center">₹ {item.amount}</span>
            <span className="text-center">{item.transactionDate}</span>
            <span className="text-center">{item.fundCategory || item.expenseCategory}</span>
            <span className="text-center">{item.fundSource || item.expenseSource}</span>

            <div className="flex gap-2 text-xs justify-end">
              <button
                onClick={() => {
                  setEditing(item);
                  setForm(item);
                  setModalOpen(true);
                }}
                className="text-blue-600"
              >
                Edit
              </button>

              <button
                onClick={() => setConfirm(item)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* ENTRY MODAL */}
      {modalOpen && (
        <Modal title={editing ? "Edit Entry" : "Add Entry"} onClose={() => setModalOpen(false)}>
          <div className="space-y-3">

            <input
              type="date"
              className="border p-2 w-full"
              value={form.transactionDate || ""}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            />

            <input
              placeholder="Amount"
              className="border p-2 w-full"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            {/* CATEGORY */}
            <div className="flex gap-2">
              <select
                className="border p-2 w-full"
                value={tab === "FUNDS" ? form.fundCategory || "" : form.expenseCategory || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [tab === "FUNDS" ? "fundCategory" : "expenseCategory"]: e.target.value,
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id}>{c.label}</option>
                ))}
              </select>

              <button
                onClick={() => setCategoryModal(true)}
                className="px-3 bg-gray-100 rounded"
              >
                +
              </button>
            </div>

            {/* SOURCE */}
            <select
              className="border p-2 w-full"
              onChange={(e) =>
                setForm({
                  ...form,
                  [tab === "FUNDS" ? "fundSource" : "expenseSource"]: e.target.value,
                })
              }
            >
              <option>Select Source</option>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <textarea
              placeholder="Remarks"
              className="border p-2 w-full"
              value={form.fundRemarks || form.expenseRemarks || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  [tab === "FUNDS" ? "fundRemarks" : "expenseRemarks"]: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button onClick={handleSave} className="bg-primary text-white px-4 py-2">
                Save
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* CATEGORY MODAL */}
      {categoryModal && (
        <Modal title="Add Category" onClose={() => setCategoryModal(false)}>
          <input
            className="border p-2 w-full mb-3"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleAddCategory} className="bg-primary text-white px-4 py-2">
            Add
          </button>
        </Modal>
      )}

      {/* CONFIRM */}
      {confirm && (
        <ConfirmDialog
          title={"Delete Entry"}
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

const Stat = ({ label, value, icon: Icon, color }) => (
  <div className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div className={`text-sm text-gray-500 ${color}`}>{label}</div>
        {Icon && <Icon size={18} className={`${color}`} />}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${color}`}>
        {value}
      </div>
    </div>
);