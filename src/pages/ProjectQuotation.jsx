import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
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
        <Editor quotation={selected} onBack={() => setScreen("list")} onSave={saveQuotation} />
      )}
    </div>
  );
}

/* ================= EDITOR ================= */

function Editor({ quotation, onBack, onSave }) {
  const [q, setQ] = useState(quotation);

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
        },
      ],
    });
  };

  const updateMilestone = (index, data) => {
    const updated = q.paymentPlan.map((m, i) => {
      if (i !== index) return m;

      const newMilestone = { ...m, ...data };

      newMilestone.amount =
        ((newMilestone.percent || 0) / 100) *
        (q.summary.finalTotal || 0);

      return newMilestone;
    });

    setQ({ ...q, paymentPlan: updated });
  };

  const totalPercent = (q.paymentPlan || []).reduce(
    (s, m) => s + (m.percent || 0),
    0
  );

  const uploadLogo = async (file) => {
    const storageRef = ref(
      storage,
      "quotation/logo_" + Date.now() + "_" + file.name
    );

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  return (
    <div id="print-area" className="bg-white p-10 max-w-5xl mx-auto text-sm">

      <button onClick={onBack} className="mb-4">← Back</button>

      {/* HEADER */}
      <div className="flex justify-between border-b pb-4">
        <div>
          <input
            type="file"
            onChange={async (e) => {
              if (!e.target.files[0]) return;

              const url = await uploadLogo(e.target.files[0]);

              setQ({
                ...q,
                company: { ...q.company, logo: url },
              });
            }}
            className="text-xs mb-2"
          />
          {q.company.logo && (
            <img src={q.company.logo} className="h-16  mb-2" />
          )}
          <h2 className="text-xl font-bold">{q.company.name}</h2>
          <p className="text-xs">{q.company.address}</p>
          <p className="text-xs">GST: {q.company.gst}</p>
        </div>

        <div className="text-right text-xs">
          <p>Date: {new Date(q.date).toLocaleDateString()}</p>
          <p>Ref: {q.ref}</p>
        </div>
      </div>

      {/* CLIENT */}
      <div className="mt-6">
        <p className="font-semibold">Prepared For</p>
        <input
          value={q.client.name || ""}
          onChange={(e) =>
            setQ({ ...q, client: { ...q.client, name: e.target.value } })
          }
          className="border-b w-full"
        />
      </div>

      {/* ITEMS */}
      <h3 className="mt-6 font-semibold border-b pb-1">Items</h3>

      <table className="w-full border table-fixed mt-2">
        <thead className="bg-gray-100">
          <tr>
            <th className="w-[30%]">Description</th>
            <th>UOM</th>
            <th>USP</th>
            <th>Qty</th>
            <th>Disc</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {q.items.map((item) => (
            <tr key={item.id} className="border-t">
              <td>
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

              <td className="text-center">₹ {item.total}</td>

              <td>
                <button onClick={()=>setQ({...q,items:q.items.filter(i=>i.id!==item.id)})} className="text-red-500">X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addItem} className="mt-2 bg-red-500 text-white px-3 py-1 rounded">
        + Add Item
      </button>

      {/* SUMMARY */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 border p-4">
          <div className="flex justify-between"><span>Subtotal</span><span>₹ {formatCurrency(q.summary.subtotal)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>₹ {q.summary.totalDiscount}</span></div>
          <div className="flex justify-between font-bold border-t mt-2 pt-2">
            <span>Total</span><span>₹ {formatCurrency(q.summary.finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* PAYMENT PLAN */}
      <h3 className="mt-8 font-semibold border-b pb-1">Payment Plan</h3>

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
      </button>

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