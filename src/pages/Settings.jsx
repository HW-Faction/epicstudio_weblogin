import { useEffect, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import NavigationHeader from "../components/NavigationHeader";
import Snackbar from "../components/Snackbar";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Settings() {
  const { user, dbUser } = useAuth();

  const [tab, setTab] = useState("PROFILE");

  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState("");

  const [snackbar, setSnackbar] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [name, setName] = useState(dbUser?.name || "");

  // ===== FETCH STAGES =====
  const fetchStages = async () => {
    const snap = await getDocs(collection(db, "settings_projectStages"));
    setStages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchStages();
  }, []);

  // ===== ADD STAGE =====
  const handleAddStage = async () => {
    if (!newStage.trim()) return;

    await addDoc(collection(db, "settings_projectStages"), {
      label: newStage,
    });

    setSnackbar({ type: "success", message: "Stage added" });
    setNewStage("");
    fetchStages();
  };

  // ===== DELETE STAGE =====
  const handleDeleteStage = async () => {
    await deleteDoc(doc(db, "settings_projectStages", confirm.id));
    setConfirm(null);
    setSnackbar({ type: "error", message: "Deleted" });
    fetchStages();
  };

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <NavigationHeader title="Settings" />

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2">
        {["PROFILE", "PROJECTS"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-full ${
              tab === t
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {t === "PROFILE" ? "Profile" : "Project Config"}
          </button>
        ))}
      </div>

      {/* ================= PROFILE ================= */}
      {tab === "PROFILE" && (
        <div className="bg-white border rounded-xl p-6 space-y-5">

          <h2 className="text-lg font-semibold text-gray-800">
            Profile
          </h2>

          {/* NAME */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <input
              className="border rounded-lg px-3 py-2 w-full text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <input
              disabled
              className="border rounded-lg px-3 py-2 w-full text-sm bg-gray-50"
              value={user?.email || ""}
            />
          </div>

          {/* ROLE */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <input
              disabled
              className="border rounded-lg px-3 py-2 w-full text-sm bg-gray-50"
              value={dbUser?.role || ""}
            />
          </div>

          {/* ACTION */}
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
              Save Changes
            </button>
          </div>

        </div>
      )}

      {/* ================= PROJECT CONFIG ================= */}
      {tab === "PROJECTS" && (
        <div className="bg-white border rounded-xl p-6 space-y-5">

          <h2 className="text-lg font-semibold text-gray-800">
            Project Stages
          </h2>

          {/* ADD */}
          <div className="flex gap-3">
            <input
              placeholder="Add new stage..."
              className="border rounded-lg px-3 py-2 text-sm flex-1"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
            />

            <button
              onClick={handleAddStage}
              className="bg-primary text-white px-4 rounded-lg text-sm"
            >
              Add
            </button>
          </div>

          {/* LIST */}
          <div className="space-y-2">
            {stages.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
              >
                <span>{s.label}</span>

                <button
                  onClick={() => setConfirm(s)}
                  className="text-red-500 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* CONFIRM */}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onConfirm={handleDeleteStage}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* SNACKBAR */}
      {snackbar && <Snackbar data={snackbar} />}

    </div>
  );
}