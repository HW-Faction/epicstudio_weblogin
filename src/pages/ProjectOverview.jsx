import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

export default function ProjectOverview() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [funds, setFunds] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const pSnap = await getDoc(doc(db, "projects", id));
      if (pSnap.exists()) setProject(pSnap.data());

      const getList = async (path) => {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map((d) => d.data());
      };

      const [m, u, e, f, c] = await Promise.all([
        getList(`projects/${id}/milestones`),
        getList(`projects/${id}/siteUploads`),
        getList(`projects/${id}/expenses`),
        getList(`projects/${id}/funds`),
        getList(`projects/${id}/fundCategories`),
      ]);

      setMilestones(m);
      setUploads(u);
      setExpenses(e);
      setFunds(f);
      setCategories(c);
    };

    fetchAll();
  }, [id]);

  if (!project) return <div className="p-6">Loading...</div>;

  // 🔥 CALCULATIONS
  const totalScopes = [...new Set(milestones.map((m) => m.milestoneScope))].length;
  const completed = milestones.filter((m) => m.milestoneStatus === "Completed").length;
  const totalMilestones = milestones.length;

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalFunds = funds.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const remaining = totalFunds - totalExpense;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-primary text-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold">{project.projectName}</h1>
        <p className="text-sm opacity-90 mt-1">
          👤 {project.clientContactDetails?.clientName} • 📌 {project.projectStage}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard icon="📦" label="Scopes" value={totalScopes} />
        <StatCard icon="🧱" label="Milestones" value={totalMilestones} />
        <StatCard icon="✅" label="Completed" value={completed} />
        <StatCard icon="📸" label="Uploads" value={uploads.length} />
        <StatCard icon="💸" label="Expenses" value={totalExpense} />
        <StatCard icon="💰" label="Funds" value={totalFunds} />
        <StatCard icon="📊" label="Balance" value={remaining} />
        <StatCard icon="🏷️" label="Categories" value={categories.length} />

      </div>

      {/* PROGRESS */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          📈 Progress Overview
        </h2>

        <ProgressBar
          label="Estimated"
          value={project.projectEstimatedProgress}
          color="bg-blue-500"
        />

        <ProgressBar
          label="Actual"
          value={project.projectActualProgress}
          color="bg-green-500"
        />
      </div>

      {/* DETAILS */}
      <div className="grid md:grid-cols-2 gap-6">

  {/* PROJECT DETAILS */}
  <div className="bg-white rounded-2xl shadow-sm border p-5">

    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        🏗 <span>Project Details</span>
      </h3>

      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
        {project.projectStage}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">

      <Field label="Owner" value={project.projectOwner} />
      <Field label="Scope" value={project.projectScope} />

      <Field
        label="Budget"
        value={
          project.projectBudget
            ? `₹ ${project.projectBudget}`
            : "-"
        }
      />

      <Field
        label="Created"
        value={formatDate(project.projectCreatedTimeStamp)}
      />

      <Field
        label="Start Date"
        value={project.projectTentativeStartDate || "-"}
      />

      <Field
        label="Handover"
        value={project.projectExpectedHandoverDate || "-"}
      />

    </div>

    {/* DESCRIPTION */}
    {project.projectDescription && (
      <div className="mt-5 pt-4 border-t">
        <p className="text-xs text-gray-500 mb-1">Description</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {project.projectDescription}
        </p>
      </div>
    )}

  </div>

  {/* CLIENT DETAILS */}
  <div className="bg-white rounded-2xl shadow-sm border p-5">

    <div className="flex items-center justify-between mb-5">
      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        👤 <span>Client Details</span>
      </h3>

      <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
        Active
      </span>
    </div>

    <div className="space-y-4 text-sm">

      {/* NAME + PHONE */}
      <div className="flex justify-between">
        <Field label="Name" value={project.clientContactDetails?.clientName} />
        <Field label="Phone" value={project.clientContactDetails?.clientNumber} />
      </div>

      {/* EMAIL */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Email</p>
        <p className="text-sm text-gray-800 break-all">
          {project.clientContactDetails?.clientPrimaryEmail || "-"}
        </p>
      </div>

      {/* ADDRESS */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Address</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {project.clientContactDetails?.clientAddress || "-"}
        </p>
      </div>

      {/* NOTE */}
      {project.clientContactDetails?.clientNote && (
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-1">Note</p>
          <p className="text-sm text-gray-700 italic">
            {project.clientContactDetails.clientNote}
          </p>
        </div>
      )}

    </div>

  </div>

</div>

      {/* FINANCIAL */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          💰 Financial Summary
        </h3>

        <div className="grid grid-cols-3 gap-4 text-center">
          <MiniStat label="Funds" value={totalFunds} />
          <MiniStat label="Expenses" value={totalExpense} />
          <MiniStat label="Remaining" value={remaining} />
        </div>
      </div>

      {/* UPLOADS */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          📸 Recent Uploads
        </h3>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {uploads.slice(0, 5).map((u, i) => (
            <img
              key={i}
              src={u.url}
              className="h-24 w-full object-cover rounded-lg hover:scale-105 transition"
            />
          ))}
        </div>
      </div>

    </div>
  );
}

/* COMPONENTS */

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition text-center">
    <div className="text-2xl mb-1">{icon}</div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const ProgressBar = ({ label, value = 0, color }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span>{label}</span>
      <span>{value || 0}%</span>
    </div>
    <div className="h-2 bg-gray-200 rounded">
      <div
        className={`h-2 rounded ${color}`}
        style={{ width: `${value || 0}%` }}
      />
    </div>
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white p-4 rounded-2xl shadow">
    <h3 className="font-medium mb-3">{title}</h3>
    {children}
  </div>
);

const Info = ({ label, value }) => (
  <p className="text-sm mb-1">
    <span className="text-gray-500">{label}: </span>
    {value || "-"}
  </p>
);

const MiniStat = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-800">
      {value || "-"}
    </p>
  </div>
);

const formatDate = (ts) => {
  if (!ts) return "-";
  const num = typeof ts === "string" ? Number(ts) : ts;
  if (isNaN(num)) return ts;
  return new Date(num).toLocaleDateString();
};