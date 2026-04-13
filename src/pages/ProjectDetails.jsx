import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";

export default function ProjectDetails() {
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

  if (!project) return <div className="p-6 text-gray-400">Loading...</div>;

  // ===== CALCULATIONS =====
  const totalScopes = [...new Set(milestones.map((m) => m.milestoneScope))].length;
  const completed = milestones.filter((m) => m.milestoneStatus === "Completed").length;
  const totalMilestones = milestones.length;

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalFunds = funds.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const remaining = totalFunds - totalExpense;

  return (
    <div className="p-6 space-y-6">
      <NavigationHeader
        title="Project Details"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: project.projectName },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* ===== HEADER ===== */}
      <div className="bg-white border rounded-2xl p-6 space-y-3">
        <h1 className="text-xl font-semibold text-gray-800">
          {project.projectName}
        </h1>

        <p className="text-sm text-gray-500">
          {project.clientContactDetails?.clientName} • {project.projectStage}
        </p>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Scopes" value={totalScopes} />
        <Stat label="Milestones" value={totalMilestones} />
        <Stat label="Completed" value={completed} />
        <Stat label="Uploads" value={uploads.length} />
        <Stat label="Expenses" value={`₹ ${totalExpense}`} />
        <Stat label="Funds" value={`₹ ${totalFunds}`} />
        <Stat label="Balance" value={`₹ ${remaining}`} highlight />
        <Stat label="Categories" value={categories.length} />
      </div>

      {/* ===== PROGRESS ===== */}
      <div className="bg-white border rounded-2xl p-5">
        <h2 className="text-sm font-medium text-gray-600 mb-4">
          Progress Overview
        </h2>

        <ProgressBar label="Estimated" value={project.projectEstimatedProgress} />
        <ProgressBar label="Actual" value={project.projectActualProgress} />
      </div>

      {/* ===== DETAILS ===== */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* PROJECT DETAILS */}
        <div className="bg-white border rounded-2xl p-5 space-y-4">

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">
              Project Details
            </h3>

            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {project.projectStage}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Owner" value={project.projectOwner} />
            <Field label="Scope" value={project.projectScope} />
            <Field label="Budget" value={project.projectBudget ? `₹ ${project.projectBudget}` : "-"} />
            <Field label="Created" value={formatDate(project.projectCreatedTimeStamp)} />
            <Field label="Start" value={project.projectTentativeStartDate || "-"} />
            <Field label="Handover" value={project.projectExpectedHandoverDate || "-"} />
          </div>

          {project.projectDescription && (
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">
                {project.projectDescription}
              </p>
            </div>
          )}

        </div>

        {/* CLIENT DETAILS */}
        <div className="bg-white border rounded-2xl p-5 space-y-4">

          <h3 className="text-sm font-semibold text-gray-700">
            Client Details
          </h3>

          <Field label="Name" value={project.clientContactDetails?.clientName} />
          <Field label="Phone" value={project.clientContactDetails?.clientNumber} />

          <Field label="Email" value={project.clientContactDetails?.clientPrimaryEmail} />
          <Field label="Address" value={project.clientContactDetails?.clientAddress} />

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

      {/* ===== FINANCIAL ===== */}
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-600 mb-4">
          Financial Summary
        </h3>

        <div className="grid grid-cols-3 gap-4 text-center">
          <MiniStat label="Funds" value={`₹ ${totalFunds}`} />
          <MiniStat label="Expenses" value={`₹ ${totalExpense}`} />
          <MiniStat label="Remaining" value={`₹ ${remaining}`} highlight />
        </div>
      </div>

      {/* ===== UPLOADS ===== */}
      <div className="bg-white border rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-600 mb-4">
          Recent Uploads
        </h3>

        {uploads.length === 0 ? (
          <p className="text-xs text-gray-400">No uploads yet</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {uploads.slice(0, 5).map((u, i) => (
              <img
                key={i}
                src={u.url}
                className="h-24 w-full object-cover rounded-lg hover:scale-105 transition"
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

/* ===== COMPONENTS ===== */

const Stat = ({ label, value, highlight }) => (
  <div className={`p-4 rounded-xl border bg-white text-center ${highlight ? "border-primary" : "border-gray-200"}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-semibold text-gray-800">{value}</p>
  </div>
);

const ProgressBar = ({ label, value = 0 }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1 text-gray-500">
      <span>{label}</span>
      <span>{value || 0}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div
        className="h-2 bg-primary rounded-full transition-all duration-500"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  </div>
);

const MiniStat = ({ label, value, highlight }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`font-semibold ${highlight ? "text-primary" : ""}`}>
      {value}
    </p>
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