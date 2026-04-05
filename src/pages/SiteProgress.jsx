import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function SiteProgress() {
  const { id } = useParams();
  const { dbUser } = useAuth();

  const role = dbUser?.role || "EMPLOYEE";
  const isClient = role === "CLIENT";

  const [uploads, setUploads] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [tab, setTab] = useState("ALL");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [clientVisible, setClientVisible] = useState(true);
  const [preview, setPreview] = useState(null);

  // 🔥 FETCH
  const fetchUploads = async () => {
    const snap = await getDocs(
      collection(db, "projects", id, "siteUploads")
    );

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setUploads(list);
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // 🔥 FILTER
  useEffect(() => {
    let data = [...uploads];

    if (isClient) {
      data = data.filter((u) => u.clientVisible);
    }

    if (tab === "VISIBLE") {
      data = data.filter((u) => u.clientVisible);
    }

    if (tab === "INTERNAL") {
      data = data.filter((u) => !u.clientVisible);
    }

    setFiltered(data);
  }, [uploads, tab, isClient]);

  // 🔥 UPLOAD
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const filePath = `projects/${id}/siteUploads/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(
        collection(db, "projects", id, "siteUploads"),
        {
          fileName: file.name,
          url,
          filePath, // 🔥 IMPORTANT for delete
          description,
          clientVisible,
          timestamp: Date.now(),
        }
      );

      setFile(null);
      setDescription("");
      setClientVisible(true);
      setShowUploadModal(false);

      fetchUploads();
    } catch (err) {
      console.error(err);
    }

    setUploading(false);
  };

  const formatDate = (ts) => {
  if (!ts) return "—";

  // handle string or number
  const num = typeof ts === "string" ? Number(ts) : ts;

  if (isNaN(num)) return "Invalid Date";

  return new Date(num).toLocaleString();
};

  // 🔥 TOGGLE
  const toggleVisibility = async (e, item) => {
    e.stopPropagation(); // 🔥 FIX click bug

    await updateDoc(
      doc(db, "projects", id, "siteUploads", item.id),
      {
        clientVisible: !item.clientVisible,
      }
    );

    fetchUploads();
  };

  // 🔥 DELETE (Firestore + Storage)
  const handleDelete = async () => {
    if (!preview) return;

    const confirmDelete = window.confirm("Delete this upload?");
    if (!confirmDelete) return;

    try {
      // delete from storage
      if (preview.filePath) {
        const fileRef = ref(storage, preview.filePath);
        await deleteObject(fileRef);
      }

      // delete from firestore
      await deleteDoc(
        doc(db, "projects", id, "siteUploads", preview.id)
      );

      setPreview(null);
      fetchUploads();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Site Progress</h1>

        {!isClient && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            + Add Progress
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b mb-5 text-sm">
        {["ALL", "VISIBLE"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${
              tab === t
                ? "border-b-2 border-red-500 text-red-500"
                : "text-gray-500"
            }`}
          >
            {t === "ALL" ? "All" : "Client Visible"}
          </button>
        ))}

        {!isClient && (
          <button
            onClick={() => setTab("INTERNAL")}
            className={`pb-2 ${
              tab === "INTERNAL"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-gray-500"
            }`}
          >
            Internal
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-4 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow hover:shadow-md overflow-hidden cursor-pointer"
            onClick={() => setPreview(item)}
          >
            <div className="h-40 relative">

              {item.url.includes("video") ? (
                <video className="w-full h-full object-cover" src={item.url} />
              ) : (
                <img className="w-full h-full object-cover" src={item.url} />
              )}

              {!isClient && (
                <button
                  onClick={(e) => toggleVisibility(e, item)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                >
                  {item.clientVisible ? "Visible" : "Internal"}
                </button>
              )}
            </div>

            <div className="p-3 text-xs text-gray-600">
              <p className="truncate">{item.description}</p>
              <p>
                {formatDate(item.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[400px] rounded p-6">
            <h3 className="text-lg font-semibold mb-3">
              Upload Progress
            </h3>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-3"/>

            <textarea
              placeholder="Description"
              className="border p-2 w-full mb-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex justify-between mb-4 text-sm">
              <span>Visible to Client</span>
              <input
                type="checkbox"
                checked={clientVisible}
                onChange={(e) => setClientVisible(e.target.checked)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button onClick={handleUpload} className="bg-primary text-white px-4 py-2 rounded">
                Upload
              </button>
            </div>

            {uploading && <p className="text-xs mt-2">Uploading...</p>}
          </div>
        </div>
      )}

      {/* 🔥 PREVIEW MODAL */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 flex flex-col z-50"
          onClick={() => setPreview(null)}
        >
          {/* TOP BAR */}
          <div
            className="flex justify-between items-center p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setPreview(null)}>✕ Close</button>

            {!isClient && (
              <button onClick={handleDelete} className="text-red-400">
                Delete
              </button>
            )}
          </div>

          {/* MEDIA */}
          <div className="flex-1 flex justify-center items-center px-4">
            {preview.url.includes("video") ? (
              <video src={preview.url} controls className="max-h-[80vh]" />
            ) : (
              <img src={preview.url} className="max-h-[80vh]" />
            )}
          </div>

          {/* INFO */}
          <div
            className="bg-white p-4 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2">
              {preview.description || "No description"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(preview.timestamp)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}