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

const STAGES = ["Planning", "Designing", "Execution", "Completed"];
const SCOPES = ["Interior", "Full Turnkey", "Architecture"];

export default function ProjectModal({ isOpen, onClose, editingProject, refresh }) {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    projectName: "",
    projectOwner: "EPIC-STUDIO",
    projectStage: "Planning",
    projectScope: "Interior",
    projectBudget: "",
    projectAssignedTo: "",

    projectTentativeStartDate: "",
    projectExpectedHandoverDate: "",

    projectDescription: "",
    projectLatestRemarks: "",

    clientName: "",
    clientNumber: "",
    clientPrimaryEmail: "",
  });

  // 🔥 Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  // 🔥 Load edit data
  useEffect(() => {
    if (editingProject) {
      setForm({
        projectName: editingProject.projectName || "",
        projectOwner: editingProject.projectOwner || "EPIC-STUDIO",
        projectStage: editingProject.projectStage || "Planning",
        projectScope: editingProject.projectScope || "Interior",
        projectBudget: editingProject.projectBudget || "",
        projectAssignedTo:
          editingProject.projectAssignedTo?.[0] || "",

        projectTentativeStartDate:
          editingProject.projectTentativeStartDate || "",
        projectExpectedHandoverDate:
          editingProject.projectExpectedHandoverDate || "",

        projectDescription:
          editingProject.projectDescription || "",
        projectLatestRemarks:
          editingProject.projectLatestRemarks || "",

        clientName:
          editingProject.clientContactDetails?.clientName || "",
        clientNumber:
          editingProject.clientContactDetails?.clientNumber || "",
        clientPrimaryEmail:
          editingProject.clientContactDetails?.clientPrimaryEmail || "",
      });
    } else {
        setForm({
      projectName: "",
      projectOwner: "EPIC-STUDIO",
      projectStage: "Planning",
      projectScope: "Interior",
      projectBudget: "",
      projectAssignedTo: "",
      projectTentativeStartDate: "",
      projectExpectedHandoverDate: "",
      projectDescription: "",
      projectLatestRemarks: "",
      clientName: "",
      clientNumber: "",
      clientPrimaryEmail: "",
    });
    }
  }, [editingProject]);

  if (!isOpen) return null;

  // 🔥 Save
  const handleSave = async () => {
    const payload = {
      projectId: editingProject?.projectId || Date.now().toString(),
      projectName: form.projectName,
      projectOwner: form.projectOwner,
      projectStage: form.projectStage,
      projectScope: form.projectScope,
      projectBudget: form.projectBudget,

      projectAssignedTo: form.projectAssignedTo
        ? [form.projectAssignedTo]
        : [],

      projectTentativeStartDate: form.projectTentativeStartDate,
      projectExpectedHandoverDate: form.projectExpectedHandoverDate,

      projectDescription: form.projectDescription,
      projectLatestRemarks: form.projectLatestRemarks,

      projectCreatedBy: user?.uid || "",
      projectCreatedTimeStamp: new Date().toISOString(),

      clientContactDetails: {
        clientName: form.clientName,
        clientNumber: form.clientNumber,
        clientPrimaryEmail: form.clientPrimaryEmail,
      },
    };

    if (editingProject) {
      await updateDoc(doc(db, "projects", editingProject.id), payload);
    } else {
      await addDoc(collection(db, "projects"), payload);
    }

    refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto rounded p-6">

        <h2 className="text-xl font-bold mb-4">
          {editingProject ? "Edit Project" : "New Project"}
        </h2>

        {/* CONTACT */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Contact Details</h3>

          <input
            placeholder="Client Name"
            className="border p-2 w-full mb-2"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />

          <input
            placeholder="Client Number"
            className="border p-2 w-full mb-2"
            value={form.clientNumber}
            onChange={(e) => setForm({ ...form, clientNumber: e.target.value })}
          />

          <input
            placeholder="Email"
            className="border p-2 w-full"
            value={form.clientPrimaryEmail}
            onChange={(e) =>
              setForm({ ...form, clientPrimaryEmail: e.target.value })
            }
          />
        </div>

        {/* PROJECT */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Project Details</h3>

          <input
            placeholder="Project Name"
            className="border p-2 w-full mb-2"
            value={form.projectName}
            onChange={(e) =>
              setForm({ ...form, projectName: e.target.value })
            }
          />

          <select
            className="border p-2 w-full mb-2"
            value={form.projectStage}
            onChange={(e) =>
              setForm({ ...form, projectStage: e.target.value })
            }
          >
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            className="border p-2 w-full mb-2"
            value={form.projectScope}
            onChange={(e) =>
              setForm({ ...form, projectScope: e.target.value })
            }
          >
            {SCOPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <input
            placeholder="Budget"
            className="border p-2 w-full mb-2"
            value={form.projectBudget}
            onChange={(e) =>
              setForm({ ...form, projectBudget: e.target.value })
            }
          />

          {/* ASSIGN USER */}
          <select
            className="border p-2 w-full"
            value={form.projectAssignedTo}
            onChange={(e) =>
              setForm({ ...form, projectAssignedTo: e.target.value })
            }
          >
            <option value="">Assign User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* DATES */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Dates</h3>

          <input
            type="date"
            className="border p-2 w-full mb-2"
            value={form.projectTentativeStartDate}
            onChange={(e) =>
              setForm({
                ...form,
                projectTentativeStartDate: e.target.value,
              })
            }
          />

          <input
            type="date"
            className="border p-2 w-full"
            value={form.projectExpectedHandoverDate}
            onChange={(e) =>
              setForm({
                ...form,
                projectExpectedHandoverDate: e.target.value,
              })
            }
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <textarea
            placeholder="Description"
            className="border p-2 w-full mb-2"
            value={form.projectDescription}
            onChange={(e) =>
              setForm({ ...form, projectDescription: e.target.value })
            }
          />

          <textarea
            placeholder="Latest Remarks"
            className="border p-2 w-full"
            value={form.projectLatestRemarks}
            onChange={(e) =>
              setForm({ ...form, projectLatestRemarks: e.target.value })
            }
          />
        </div>

        {/* ACTIONS */}
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
  );
}