import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";
import ImagePreviewModal from "../components/ImagePreviewModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Snackbar from "../components/Snackbar";
import UploadModal from "../components/UploadModal";

export default function SiteProgress() {
  const { id } = useParams();
  const { dbUser } = useAuth();

  const isClient = dbUser?.role === "CLIENT";
  

  const [project, setProject] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [preview, setPreview] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [tab, setTab] = useState("ALL");

  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [clientVisible, setClientVisible] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [snackbar, setSnackbar] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ===== FETCH =====
  const fetchAll = async () => {
    const p = await getDoc(doc(db, "projects", id));
    if (p.exists()) setProject(p.data());

    const snap = await getDocs(collection(db, "projects", id, "siteUploads"));
    setUploads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    let data = [...uploads];
    if (isClient) data = data.filter((u) => u.clientVisible);
    if (tab === "VISIBLE") data = data.filter((u) => u.clientVisible);
    if (tab === "INTERNAL") data = data.filter((u) => !u.clientVisible);
    setFiltered(data);
  }, [uploads, tab, isClient]);

  // ===== UPLOAD =====
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      const path = `projects/${id}/siteUploads/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      setProgress(70);

      const url = await getDownloadURL(storageRef);
      setProgress(100);

      await addDoc(collection(db, "projects", id, "siteUploads"), {
        url,
        filePath: path,
        description,
        clientVisible,
        timestamp: Date.now(),
      });

      setSnackbar({ type: "success", message: "Upload successful" });

      // RESET
      setShowUpload(false);
      setFile(null);
      setDescription("");
      setClientVisible(true);
      setProgress(0);

      fetchAll();
    } catch (err) {
      console.error(err);
      setSnackbar({ type: "error", message: "Upload failed" });
    }

    setUploading(false);
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!preview) return;

    try {
      if (preview.filePath) {
        await deleteObject(ref(storage, preview.filePath));
      }

      await deleteDoc(doc(db, "projects", id, "siteUploads", preview.id));

      setSnackbar({ type: "error", message: "Deleted" });

      setPreview(null);
      setConfirmOpen(false);

      fetchAll();
    } catch (err) {
      console.error(err);
      setSnackbar({ type: "error", message: "Delete failed" });
    }
  };

  // ===== AUTO HIDE SNACKBAR =====
  useEffect(() => {
    if (!snackbar) return;
    const t = setTimeout(() => setSnackbar(null), 3000);
    return () => clearTimeout(t);
  }, [snackbar]);

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader
        title="Site Progress"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: `${project?.projectName || "Project"} (${id})` },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* TABS */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {["ALL", "VISIBLE", !isClient && "INTERNAL"].filter(Boolean).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-full ${tab === t ? "bg-primary text-white" : "bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>

             {/* ACTION */}
          <div className="flex justify-end">
            {!isClient && (
              <button
                onClick={() => setShowUpload(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
              >
                + Upload
              </button>
            )}
          </div>
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="text-sm text-gray-400">No uploads yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setPreview(item)}
              className="border rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={item.url}
                className="h-40 w-full object-cover group-hover:scale-105 transition"
              />
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS (STRICT CONTROL) ===== */}

      {showUpload && (
        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          file={file}
          setFile={setFile}
          description={description}
          setDescription={setDescription}
          clientVisible={clientVisible}
          setClientVisible={setClientVisible}
          uploading={uploading}
          progress={progress}
          onUpload={handleUpload}
        />
      )}

      {preview && (
        <ImagePreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onDelete={() => setConfirmOpen(true)}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          open={confirmOpen}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {snackbar && <Snackbar data={snackbar} />}

    </div>
  );
}