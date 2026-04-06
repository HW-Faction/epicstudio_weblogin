    import { useEffect, useState } from "react";
    import { useParams } from "react-router-dom";

    import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    } from "firebase/firestore";

    import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    } from "firebase/storage";

    import { db } from "../firebase"; // your existing config

    export default function ProjectQuotation() {
    const { id: projectId } = useParams();

    const [screen, setScreen] = useState("list");
    const [quotations, setQuotations] = useState([]);
    const [selected, setSelected] = useState(null);

    const storage = getStorage();

    const quotationRef = collection(db, "projects", projectId, "quotations");

    /* ================= FETCH ================= */

    useEffect(() => {
        fetchQuotations();
    }, [projectId]);

    async function fetchQuotations() {
        const snap = await getDocs(quotationRef);
        const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isExisting: true,
        }));
        setQuotations(data);
    }

    /* ================= SAVE ================= */

    async function saveQuotation(q) {
        const updated = calculateQuotation(q);

        if (q.isExisting) {
        const docRef = doc(db, "projects", projectId, "quotations", q.id);

        await updateDoc(docRef, {
            ...updated,
            version: (q.version || 1) + 1,
            updatedAt: Date.now(),
        });
        } else {
        const docRef = await addDoc(quotationRef, {
            ...updated,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            createdBy: "You",
            state: "Created",
        });

        updated.id = docRef.id;
        }

        await fetchQuotations();
        setScreen("list");
    }

    const handleSave = async () => {
  let attachments = [];

  // keep old attachments
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

  // 🔥 CLEAN OBJECT (IMPORTANT)
  const cleaned = { ...form };
  delete cleaned.id;
  delete cleaned.files;

  const payload =
    tab === "FUNDS"
      ? { ...cleaned, fundReceipt: attachments }
      : { ...cleaned, expenseReceipt: attachments };

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
    /* ================= DELETE ================= */

    async function deleteQuotation(id) {
        await deleteDoc(doc(db, "projects", projectId, "quotations", id));
        fetchQuotations();
    }

    /* ================= UI ================= */

    return (
        <div className="flex">

        {/* SIDEBAR */}
        

        {/* MAIN */}
        <div className="flex-1 p-6 bg-gray-50">

            {/* LIST SCREEN */}
            {screen === "list" && (
            <>
                <div className="flex justify-between mb-4">
                <h1 className="text-xl font-semibold">Quotation Generator</h1>

                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                    setSelected(newQuotation());
                    setScreen("editor");
                    }}
                >
                    + Quotation
                </button>
                </div>

                {/* TABLE FIXED */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm table-fixed">
                    <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="p-3 text-left w-[120px]">Ref</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 w-[80px] text-center">Ver</th>
                        <th className="p-3 w-[80px] text-center">Items</th>
                        <th className="p-3 w-[120px] text-center">Amount</th>
                        <th className="p-3 w-[120px]">Author</th>
                        <th className="p-3 w-[120px]">Created</th>
                        <th className="p-3 w-[120px]">State</th>
                        <th className="p-3 w-[100px]">Action</th>
                    </tr>
                    </thead>

                    <tbody>
                    {quotations.map((q) => (
                        <tr key={q.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">{q.ref}</td>
                        <td className="p-3">{q.name}</td>
                        <td className="p-3 text-center">v{q.version}</td>
                        <td className="p-3 text-center">{q.items?.length || 0}</td>
                        <td className="p-3 text-center font-medium">
                            ₹ {q.finalAmount || 0}
                        </td>
                        <td className="p-3 text-center">{q.createdBy}</td>
                        <td className="p-3 text-center">
                            {new Date(q.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                            <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">
                            {q.state}
                            </span>
                        </td>
                        <td className="p-3 space-x-2">
                            <button
                            className="text-blue-500 text-sm"
                            onClick={() => {
                                setSelected(q);
                                setScreen("editor");
                            }}
                            >
                            Edit
                            </button>

                            <button
                            className="text-red-500 text-sm"
                            onClick={() => deleteQuotation(q.id)}
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

            {/* EDITOR */}
            {screen === "editor" && (
            <Editor
                quotation={selected}
                onBack={() => setScreen("list")}
                onSave={saveQuotation}
                storage={storage}
            />
            )}
        </div>
        </div>
    );
    }

    /* ================= EDITOR ================= */

    function Editor({ quotation, onBack, onSave, storage }) {
    const [q, setQ] = useState(quotation);
    const [showItem, setShowItem] = useState(false);

    useEffect(() => {
  setQ(quotation);
}, [quotation]);

    const updateItem = (id, data) => {
        const items = q.items.map((i) =>
        i.id === id
            ? { ...i, ...data, total: calculateItemTotal({ ...i, ...data }) }
            : i
        );
        setQ({ ...q, items });
    };

    return (
        <div>
        <button onClick={onBack}>← Back</button>

        <input
            value={q.name}
            onChange={(e) => setQ({ ...q, name: e.target.value })}
            className="border p-2 w-full my-4 rounded"
            placeholder="Quotation Name"
        />

        {/* ITEMS */}
        <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex justify-between mb-3">
            <h3 className="font-medium">Items</h3>

            <button
                onClick={() => setShowItem(true)}
                className="bg-red-500 text-white px-3 py-1 rounded"
            >
                + Add Item
            </button>
            </div>

            {q.items.map((item) => (
            <div
                key={item.id}
                className="grid grid-cols-7 gap-2 border-b py-2 items-center"
            >
                <input
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                className="border p-1"
                />

                <input
                value={item.category}
                onChange={(e) =>
                    updateItem(item.id, { category: e.target.value })
                }
                className="border p-1"
                placeholder="Category"
                />

                <input
                type="number"
                value={item.price}
                onChange={(e) =>
                    updateItem(item.id, { price: Number(e.target.value) })
                }
                className="border p-1"
                />

                <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                    updateItem(item.id, { quantity: Number(e.target.value) })
                }
                className="border p-1"
                />

                <div className="text-right">₹ {item.total}</div>

                <button
                onClick={() =>
                    setQ({
                    ...q,
                    items: q.items.filter((i) => i.id !== item.id),
                    })
                }
                className="text-red-500 text-sm"
                >
                Delete
                </button>
            </div>
            ))}
        </div>

        {/* SAVE */}
        <button
            onClick={() => onSave(q)}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
            Save
        </button>

        {showItem && (
            <ItemDialog
            onClose={() => setShowItem(false)}
            onAdd={(item) => {
                setQ({ ...q, items: [...q.items, item] });
                setShowItem(false);
            }}
            storage={storage}
            />
        )}
        </div>
    );
    }

    /* ================= ITEM ================= */

    function ItemDialog({ onClose, onAdd, storage }) {
  const [item, setItem] = useState({
    id: Date.now(),
    name: "",
    category: "",
    price: 0,
    quantity: 1,
    total: 0,
    imageUrl: "",
  });

  async function uploadImage(file) {
    const storageRef = ref(
      storage,
      "quotationItems/" + Date.now() + "_" + file.name
    );
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[700px] p-6 rounded-xl grid grid-cols-2 gap-6"
        onClick={(e) => e.stopPropagation()}
      >

        {/* LEFT */}
        <div>
          <input
            type="file"
            onChange={async (e) => {
              if (!e.target.files[0]) return;
              const url = await uploadImage(e.target.files[0]);
              setItem({ ...item, imageUrl: url });
            }}
          />

          {item.imageUrl && (
            <img
              src={item.imageUrl}
              className="mt-3 rounded-lg max-h-40"
            />
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-3">

          <input
            placeholder="Item Name"
            className="border p-2 w-full rounded"
            onChange={(e) => setItem({ ...item, name: e.target.value })}
          />

          <input
            placeholder="Category"
            className="border p-2 w-full rounded"
            onChange={(e) => setItem({ ...item, category: e.target.value })}
          />

          <input
            type="number"
            placeholder="Price"
            className="border p-2 w-full rounded"
            onChange={(e) =>
              setItem({ ...item, price: Number(e.target.value) })
            }
          />

          <input
            type="number"
            placeholder="Quantity"
            className="border p-2 w-full rounded"
            onChange={(e) =>
              setItem({ ...item, quantity: Number(e.target.value) })
            }
          />

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">

            <button
              onClick={onClose}
              className="px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                if (!item.name) return;
                onAdd({
                  ...item,
                  total: calculateItemTotal(item),
                });
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Add Item
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

    /* ================= UTILS ================= */

    function newQuotation() {
    return {
        id: "",
        ref: "QT-" + Math.floor(Math.random() * 10000),
        name: "",
        items: [],
        version: 1,
        createdBy: "You",
    };
    }

    function calculateItemTotal(item) {
    if (item.pricingType === "PER_AREA") return item.price * item.area;
    if (item.pricingType === "PER_UNIT") return item.price * item.quantity;
    return item.price;
    }

    function calculateQuotation(q) {
    const subTotal = q.items.reduce((s, i) => s + i.total, 0);
    return { ...q, subTotal, finalAmount: subTotal };
    }