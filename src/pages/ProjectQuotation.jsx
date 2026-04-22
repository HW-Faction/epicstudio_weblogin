import { useEffect, useState, useRef } from "react";
import Modal from "../components/Modal";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { storage } from "../firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import logo from "../../public/logo.png"
import { Rows3Icon, Columns3Icon, DeleteIcon, Grip, Edit } from 'lucide-react'
import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";
import TabSwitch from "../components/TabSwitch";

/* ================= DEFAULTS ================= */

const DEFAULT_COMPANY = {
  name: "EPIC STUDIO",
  address: "502/503, 5th FLOOR, CONSCIENT ONE MALL, SECTOR 109, GURGAON",
  phone: "9871820064",
  gst: "06AAICE7957M1ZX",
  logo: "", // add URL if needed
};

const DEFAULT_BANK = {
  accountName: "EPIC-STUDIO INTERIOR DESIGN PRIVATE LIMITED",
  accountNumber: "589505000033",
  ifsc: "ICIC0005895",
  bankName: "ICICI BANK",
  branch: "SHOBHA CITY, SEC-108, GURUGRAM",
};

const DEFAULT_TERMS = [
  "This quotation is valid for 30 days from the date of issue.",
  "Taxes (GST) included as mentioned.",
  "Changes after finalization will be charged additionally.",
];

/* ================= MAIN ================= */

export default function ProjectQuotation() {
  const { id: projectId } = useParams();

  const [screen, setScreen] = useState("list");
  const [quotations, setQuotations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [project, setProject] = useState(null);

  const quotationRef = collection(db, "projects", projectId, "quotations");

  useEffect(() => {
    fetchQuotations();
  }, [projectId]);

  async function fetchQuotations() {
    const snap = await getDocs(quotationRef);
    setQuotations(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isExisting: true,
      }))
    );
  }

  useEffect(() => {
    const fetchProject = async () => {     
      const snap = await getDoc(doc(db, "projects", projectId));
      if (snap.exists()) {     
        setProject({ id: snap.id, ...snap.data() });
      }
    };
    fetchProject();
  }, [projectId]);

  async function saveQuotation(q) {
    const updated = calculateQuotation(q);

    if (q.isExisting) {
      await updateDoc(doc(db, "projects", projectId, "quotations", q.id), {
        ...updated,
        version: (q.version || 1) + 1,
        updatedAt: Date.now(),
      });
    } else {
      const docRef = doc(collection(db, "projects", projectId, "quotations"));

      await setDoc(docRef, {
        ...updated,
        id: docRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        state: "Created",
      });
    }

    fetchQuotations();
    setScreen("list");
  }

  async function deleteQuotation(id) {
    if (!window.confirm("Delete quotation?")) return;

    await deleteDoc(doc(db, "projects", projectId, "quotations", id));
    fetchQuotations();
  }


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <NavigationHeader
              title="Project Quotations"
              breadcrumbs={[
                { label: "Projects", path: "/projects" },
                { label: project?.projectName },
              ]}
              rightContent={<ProjectNavigationChips />}
            />

      {screen === "list" && (
        <>
          <div className="flex justify-between mb-4">
            <h1 className="text-xl font-semibold">Quotation Generator</h1>

            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => {
                setSelected(newQuotation());
                setScreen("editor");
              }}
            >
              + Quotation
            </button>
          </div>

          <div className="bg-white shadow rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-center">Ref</th>
                  <th className="p-2 text-center">Client</th>
                  <th className="p-2 text-center">Version</th>
                  <th className="p-2 text-center">Created At</th>
                  <th className="p-2 text-center">Items Total</th>
                  <th className="p-2 text-center">Total</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="text-center p-2">{q.ref}</td>
                    <td className="text-center">{q.client?.name}</td>
                    <td className="text-center">v{q.version}</td>
                    <td className="text-center">{formatDate(q.createdAt)}</td>
                    <td className="text-center">{q.items.length}</td>
                    <td className="text-center">₹ {formatCurrency(q.summary.finalTotal) || 0}</td>
                    <td className="text-center">
                      <button
                        onClick={() => {
                          setSelected(q);
                          setScreen("editor");
                        }}
                        className="text-blue-500 mr-2"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteQuotation(q.id)}
                        className="text-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {screen === "editor" && (
        <Editor quotation={selected} onBack={() => setScreen("list")} onSave={saveQuotation} p={project} />
      )}
    </div>
  );
}

/* ================= EDITOR ================= */

function Editor({ quotation, onBack, onSave, p }) {
  const [q, setQ] = useState(quotation);
  const [project] = useState(p);
  const [view, setView] = useState("PREVIEW");
  const [editing, setEditing] = useState(null);
  const [rowConfig, setRowConfig] = useState({
    name: true, area: true, category: true, description: true, specification: true
  });
  const [columnConfig, setColumnConfig] = useState({
    sNo: true, description: true, uom: true, usp: true, qty: true, total: true, disc: true
  });
  
  const [form, setForm] = useState({
    area: "",
    category: "",
    name: "",
    quantity: "",
    desctiption: "",
    uom: "",
    usp: "",
    total: "0",
    discount: "0"
  });

  const [open, setOpen] = useState(null); // "rows" | "columns" | null
  const ref = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(null);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // 🔥 TOGGLE HANDLERS
  const toggleRow = (key) => {
    setRowConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleColumn = (key) => {
    setColumnConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    setQ(quotation);
  }, [quotation]);

  useEffect(() => {
    setQ((prev) => calculateQuotation(prev));
  }, [q.items]);

  /* ===== FIX: recalc milestones ===== */
  useEffect(() => {
    if (!q.paymentPlan) return;

    const updated = q.paymentPlan.map((m) => ({
      ...m,
      amount: ((m.percent || 0) / 100) * (q.summary.finalTotal || 0),
    }));

    setQ((prev) => ({ ...prev, paymentPlan: updated }));
  }, [q.summary.finalTotal]);

  const updateItem = (id, data) => {
    const items = q.items.map((i) =>
      i.id === id ? { ...i, ...data, total: calcItem(i, data) } : i
    );
    setQ({ ...q, items });
  };

  const handleSaveItem = () => {
    const itemData = {
      ...form,
      description: form.desctiption, // fix mapping
      total: calcModalTotal(),
    };

    if (editing) {
      // 🔁 UPDATE
      const items = q.items.map((i) =>
        i.id === editing.id ? { ...i, ...itemData } : i
      );

      setQ({ ...q, items });
    } else {
      // ➕ ADD
      setQ({
        ...q,
        items: [
          ...q.items,
          {
            id: Date.now(),
            ...itemData,
          },
        ],
      });
    }

    // RESET
    setOpenModal(false);
    setEditing(null);
    setForm({
      area: "",
      category: "",
      name: "",
      quantity: "",
      desctiption: "",
      uom: "",
      usp: "",
      total: "0",
      discount: "0",
      itemCode: "",
      specification: "",
    });
  };

  const openEditItem = (item) => {
    setEditing(item);

    setForm({
      ...item,
      desctiption: item.description || "",
    });

    setOpenModal(true);
  };

  const addItem = () => {
    setQ({
      ...q,
      items: [
        ...q.items,
        {
          id: Date.now(),
          name: "",
          uom: "Sqft",
          usp: 0,
          quantity: 1,
          discount: 0,
          total: 0,
          category: "",
          description: "",
          specification: "",
          area: "",
          itemCode: "",
        },
      ],
    });
  };

  const calcModalTotal = () => {
    const qty = Number(form.quantity || 0);
    const usp = Number(form.usp || 0);
    const discount = Number(form.discount || 0);

    const total = qty * usp - discount;
    return total > 0 ? total : 0;
  };

  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const [categories, setCategories] = useState([]);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");

  //const uniqueCategories = ;

  const filteredItems = (q.items || [])
  .filter((item) => {
    const text = JSON.stringify(item).toLowerCase();

    const matchSearch =
      !search || text.includes(search.toLowerCase());

    const matchCategory =
      !filterCategory ||
      item.category === filterCategory;

    return matchSearch && matchCategory;
  })
  .sort((a, b) => {
    let valA, valB;

    if (sortBy === "amount") {
      valA = Number(a.total || a.qty * a.usp || 0);
      valB = Number(b.total || b.qty * b.usp || 0);
    } 
    else if (sortBy === "qty") {
      valA = Number(a.qty || 0);
      valB = Number(b.qty || 0);
    } 
    else {
      valA = (a.description || "").toLowerCase();
      valB = (b.description || "").toLowerCase();
    }

    if (typeof valA === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return sortOrder === "asc" ? valA - valB : valB - valA;
  });
  
  return (
    <div>
      <>
        {/* FAB */}
        <button
          onClick={() => setOpenModal(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-2xl"
        >
          +
        </button>
      </>


      {/* YOUR MODAL */}
      {openModal && (
        <Modal
          title={editing ? "Edit Item" : "New Item"}
          onClose={() => {
            setOpenModal(false);
            setEditing(null);
          }}
        >
          <div className="grid grid-cols-3 gap-4">

            <input
              placeholder="Area"
              className="border p-2 col-span-2"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />

            <input
              placeholder="Item Code"
              className="border p-2 col-span-1"
              value={form.itemCode || ""}
              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
            />

            <div className="flex col-span-3">
              <select
                className="border p-2 w-full"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {uniqueCategories.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() => setCatModal(true)}
                className="px-3 bg-gray-100 rounded"
              >
                +
              </button>
            </div>

            <input
              placeholder="Name"
              className="border p-2 col-span-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <textarea
              placeholder="Description"
              className="border p-2 col-span-3"
              value={form.desctiption}
              onChange={(e) => setForm({ ...form, desctiption: e.target.value })}
            />

            <textarea
              placeholder="Specifications"
              className="border p-2 col-span-3"
              value={form.specification || ""}
              onChange={(e) =>
                setForm({ ...form, specification: e.target.value })
              }
            />

            <input
              placeholder="UOM"
              className="border p-2 col-span-1"
              value={form.uom}
              onChange={(e) => setForm({ ...form, uom: e.target.value })}
            />

            <input
              placeholder="USP"
              className="border p-2 col-span-1"
              value={form.usp}
              onChange={(e) => setForm({ ...form, usp: e.target.value })}
            />

            <input
              placeholder="QTY"
              className="border p-2 col-span-1"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: e.target.value })
              }
            />

            <input
              placeholder="Discount"
              className="border p-2 col-span-3"
              value={form.discount || ""}
              onChange={(e) =>
                setForm({ ...form, discount: e.target.value })
              }
            />
          </div>

          {/* ✅ TOTAL DISPLAY */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold text-lg">
              ₹ {calcModalTotal()}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setOpenModal(false);
                setEditing(null);
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSaveItem}
              className="bg-primary text-white px-4 py-2"
            >
              {editing ? "Update" : "Save"}
            </button>
          </div>
        </Modal>
      )}
      
      <div className="flex justify-start mb-6">
        <TabSwitch
          value={view}
          onChange={setView}
          options={[
            { label: "Items List", value: "ITEMS" },
            { label: "Preview", value: "PREVIEW" },
          ]}
        />
      </div>

      {view === "PREVIEW" && (
        <div id="print-area" className="bg-white px-16 py-8 w-[75%] max-w-5xl mx-auto text-sm">

          {/* <button onClick={onBack} className="mb-4">← Back</button> */}

          {/* HEADER */}
          <div className="flex justify-between border-b pb-4">
            <div>
              <img src={logo} className="h-48 w-54" />
            </div>

            <div className="text-left text-sm w-[40%]">
              <br />
              <h2 className="text-xl font-bold">{q.company.name}</h2>
              <br />
              <p className="text-sm">{q.company.address}</p>
              <p className="text-sm">GST: {q.company.gst}</p>
            </div>
          </div>

          {/* CLIENT */}
          <div className="mt-6 text-sm">
            <p className="font-base text-gray-500">Prepared For</p>
            <h2 className="text-xl font-bold">{project.clientContactDetails?.clientName}</h2>
            <p className="text-sm font-semibold">{project.projectName}</p>
            <br />
            <p className="text-sm font-semibold">Date: {new Date(q.date).toLocaleDateString()}</p>
            <br />
            <p className="text-sm font-semibold">Ref: {q.ref}</p>
          </div>

          <br />
        
          <div className="flex justify-center">
            <div
              ref={ref}
              className="relative bg-slate-100 flex justify-between w-[20%] px-4 py-2 rounded-xl"
            >
              {/* ROW ICON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(open === "rows" ? null : "rows");
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Rows3Icon className="w-5 h-5" />
              </button>

              {/* COLUMN ICON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(open === "columns" ? null : "columns");
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Columns3Icon className="w-5 h-5" />
              </button>
              
              {/* 🔽 DROPDOWN */}
              {open && (
                <div
                  className={`absolute top-full mt-2 w-56 bg-white border rounded-xl shadow-lg z-50 p-3 space-y-2 ${
                    open === "rows" ? "left-0" : "right-0"
                  }`}
                >
                  <p className="text-xs text-gray-500 mb-2">
                    {open === "rows" ? "Row Fields" : "Column Fields"}
                  </p>

                  {(open === "rows"
                    ? Object.entries(rowConfig)
                    : Object.entries(columnConfig)
                  ).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() =>
                          open === "rows"
                            ? toggleRow(key)
                            : toggleColumn(key)
                        }
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          

          {/* ITEMS */}

          <table className="w-full border table-fixed mt-2">
            <thead className="bg-gray-100">
              <tr>
                { columnConfig.sNo && (<th>S No.</th>) }
                { columnConfig.description && (<th className="w-[50%] p-3">Description</th>) }
                { columnConfig.uom && (<th className="text-center p-3">UOM</th>) }
                { columnConfig.usp && (<th className="text-center">USP</th>) }
                { columnConfig.qty && (<th className="text-center">Qty</th>) }
                { columnConfig.disc && (<th className="text-center">Disc</th>) }
                { columnConfig.total && (<th className="text-center">Total</th>) }
                { columnConfig.total && (<th className="text-center">Action</th>) }
              </tr>
            </thead>

            <tbody>
              {q.items.map((item, i) => (
                <tr key={item.id} className="border-t">
                  { columnConfig.sNo && (<th>{i + 1}</th>) }
                  { columnConfig.description && (
                    <td className="w-[50%] p-4">
                    {(item.name && rowConfig.name) && (<p className="text-red-600">{item.name}</p>)}
                    {item.description && (
                      <div>
                        { rowConfig.area && (
                          <div className="flex justify-start">
                            <p className="font-semibold mr-2">Area:  </p>
                            <p>{item.area}</p>
                          </div>
                        ) }
                        { rowConfig.category && (
                          <div className="flex justify-start">
                            <p className="font-semibold mr-2">Category: </p>
                            <p>{item.category}</p>
                          </div>
                        ) }   
                      </div>       
                    )}
                    {(item.description && rowConfig.description) && (<p>{item.description}</p>)}
                  </td>
                  ) }
                  
                  { columnConfig.uom && (<td className="text-center">{item.uom}</td>) }
                  { columnConfig.usp && (<td className="text-center">{item.usp}</td>) }
                  { columnConfig.qty && (<td className="text-center">{item.quantity}</td>) }
                  { columnConfig.disc && (<td className="text-center">{item.discount}</td>) }
                  { columnConfig.total && (<td className="text-center">₹ {item.total}</td>) }
                  <td onClick={() => openEditItem(item)} className="text-center text-red-600">Edit </td>
                  
                  {/* <td>
                    <textarea
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, { name: e.target.value })
                      }
                      className="w-full border"
                    />
                  </td>

                  <td><input value={item.uom} onChange={(e)=>updateItem(item.id,{uom:e.target.value})} className="w-full border"/></td>
                  <td><input type="number" value={item.usp} onChange={(e)=>updateItem(item.id,{usp:Number(e.target.value)})} className="w-full border"/></td>
                  <td><input type="number" value={item.quantity} onChange={(e)=>updateItem(item.id,{quantity:Number(e.target.value)})} className="w-full border"/></td>
                  <td><input type="number" value={item.discount} onChange={(e)=>updateItem(item.id,{discount:Number(e.target.value)})} className="w-full border"/></td>


                  <td>
                    <button onClick={()=>setQ({...q,items:q.items.filter(i=>i.id!==item.id)})} className="text-red-500">X</button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>

          {/* <button onClick={addItem} className="mt-2 bg-red-500 text-white px-3 py-1 rounded">
            + Add Item
          </button> */}

          {/* SUMMARY */}
          <div className="mt-6 ">
            <div className="w-full border p-4">
              <div className="flex justify-between"><span>Subtotal</span><span>₹ {formatCurrency(q.summary.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>₹ {q.summary.totalDiscount}</span></div>
              <div className="flex justify-between font-bold border-t mt-2 pt-2">
                <span>Total</span><span>₹ {formatCurrency(q.summary.finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT PLAN */}
          {/* <h3 className="mt-8 font-semibold border-b pb-1">Payment Plan</h3>

          {totalPercent !== 100 && (
            <p className="text-red-500 text-xs">
              Total % = {totalPercent}% (should be 100%)
            </p>
          )}

          <table className="w-full border table-fixed mt-2">
            <tbody>
              {q.paymentPlan.map((m, i) => (
                <tr key={i} className="border-t">
                  <td><input value={m.milestone} onChange={(e)=>updateMilestone(i,{milestone:e.target.value})} className="w-full border"/></td>
                  <td><input value={m.description} onChange={(e)=>updateMilestone(i,{description:e.target.value})} className="w-full border"/></td>
                  <td><input type="number" value={m.percent} onChange={(e)=>updateMilestone(i,{percent:Number(e.target.value)})} className="w-full border"/></td>
                  <td className="text-center">₹ {m.amount}</td>
                  <td><button onClick={()=>setQ({...q,paymentPlan:q.paymentPlan.filter((_,x)=>x!==i)})}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={()=>setQ({...q,paymentPlan:[...q.paymentPlan,{milestone:"",description:"",percent:0,amount:0}]})}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded">
            + Add Milestone
          </button> */}

          {/* BANK */}
          <h3 className="mt-8 font-semibold border-b pb-1">Bank Details</h3>
          <div className="text-xs mt-2">
            <p>{q.bankDetails.accountName}</p>
            <p>A/C: {q.bankDetails.accountNumber}</p>
            <p>IFSC: {q.bankDetails.ifsc}</p>
            <p>{q.bankDetails.bankName}</p>
            <p>{q.bankDetails.branch}</p>
          </div>

          {/* TERMS */}
          <h3 className="mt-8 font-semibold border-b pb-1">Terms</h3>
          <textarea
            value={q.terms.join("\n")}
            onChange={(e)=>setQ({...q,terms:e.target.value.split("\n")})}
            className="w-full border mt-2"
            rows={6}
          />

          {/* ACTION */}
          <div className="mt-6">
            <button onClick={()=>onSave(q)} className="bg-green-500 text-white px-4 py-2 rounded">
              Save
            </button>

            <button onClick={()=>window.print()} className="ml-4 bg-blue-500 text-white px-4 py-2 rounded">
              Export PDF
            </button>
          </div>
        </div>)
      }

      {view === "ITEMS" && (
        <div>
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
              {uniqueCategories.map((c) => (
                <option key={c.id}>{c}</option>
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
          <table className="w-full border table-fixed mt-4">
            <thead className="bg-gray-100">
              <tr>
                { columnConfig.sNo && (<th className="w-[1%]"></th>) }
                { columnConfig.sNo && (<th>S No.</th>) }
                { columnConfig.description && (<th className="w-[50%]">Description</th>) }
                { columnConfig.uom && (<th className="text-center">UOM</th>) }
                { columnConfig.usp && (<th className="text-center">USP</th>) }
                { columnConfig.qty && (<th className="text-center">Qty</th>) }
                { columnConfig.disc && (<th className="text-center">Disc</th>) }
                { columnConfig.total && (<th className="text-center">Total</th>) }
                { columnConfig.total && (<th className="text-center">Action</th>) }
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item, i) => (
                <tr key={item.id} className="border-t">
                  <td className="w-[1%] ms-1"><Grip /></td>   
                  { columnConfig.sNo && (<th className="ms-4 text-center">{i + 1}</th> ) }
                  { columnConfig.description && (
                    <td className="w-[50%] p-4">
                    {(item.name && rowConfig.name) && (<p className="text-red-600">{item.name}</p>)}
                    {item.description && (
                      <div>
                        { rowConfig.area && (
                          <div className="flex justify-start">
                            <p className="font-semibold mr-2">Area:  </p>
                            <p>{item.area}</p>
                          </div>
                        ) }
                        { rowConfig.category && (
                          <div className="flex justify-start">
                            <p className="font-semibold mr-2">Category: </p>
                            <p>{item.category}</p>
                          </div>
                        ) }   
                      </div>       
                    )}
                    {(item.description && rowConfig.description) && (<p>{item.description}</p>)}
                  </td>
                  ) }
                  
                  { columnConfig.uom && (<td className="text-center">{item.uom}</td>) }
                  { columnConfig.usp && (<td className="text-center">{item.usp}</td>) }
                  { columnConfig.qty && (<td className="text-center">{item.quantity}</td>) }
                  { columnConfig.disc && (<td className="text-center">{item.discount}</td>) }
                  { columnConfig.total && (<td className="text-center">₹ {item.total}</td>) }
                  <td onClick={() => openEditItem(item)} className="text-center text-red-600">Edit </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {catModal && (
              <Modal title="Add Category" onClose={() => setCatModal(false)}>
                <div className="space-y-3">
      
                  <input
                    placeholder="Category name"
                    className="border p-2 w-full"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  />
      
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setCatModal(false)}>Cancel</button>
      
                    <button
                      onClick={() => {
                        if (!newCat.trim()) return;
      
                        const cat = newCat.trim();
      
                        if (!categories.includes(cat)) {
                          setCategories((prev) => [...prev, cat]);
                        }
      
                        setForm((prev) => ({
                          ...prev,
                          category: cat,
                        }));
      
                        setNewCat("");
                        setCatModal(false);
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

/* ================= LOGIC ================= */

function calcItem(old, data) {
  const i = { ...old, ...data };
  return (i.usp || 0) * (i.quantity || 0) - (i.discount || 0);
}

function calculateQuotation(q) {
  const subtotal = q.items.reduce((s, i) => s + (i.total || 0), 0);
  const totalDiscount = q.items.reduce((s, i) => s + (i.discount || 0), 0);

  return {
    ...q,
    summary: {
      subtotal,
      totalDiscount,
      finalTotal: subtotal,
    },
  };
}

function newQuotation() {
  return {
    ref: "EPI-" + Date.now(),
    date: Date.now(),
    company: DEFAULT_COMPANY,
    client: {},
    items: [],
    paymentPlan: [],
    bankDetails: DEFAULT_BANK,
    summary: { subtotal: 0, totalDiscount: 0, finalTotal: 0 },
    terms: DEFAULT_TERMS,
    version: 1,
    state: "Created",
  };
}

const formatDate = (ts) => {
  if (!ts) return "-";
  const num = typeof ts === "string" ? Number(ts) : ts;
  if (isNaN(num)) return ts;
  return new Date(num).toLocaleDateString();
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat("en-IN").format(num || 0);
};