import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Folder, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActions from "./QuickActions";

// ===== DATE UTILS =====
const parseDate = (d) => (d ? new Date(d) : null);
const isToday = (d) => {
  const date = parseDate(d);
  if (!date) return false;
  const t = new Date();
  return date.toDateString() === t.toDateString();
};
const isOverdue = (d) => {
  const date = parseDate(d);
  if (!date) return false;
  return date < new Date();
};

export default function Dashboard() {
  const { user, dbUser } = useAuth();
  const role = dbUser?.role;

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const projectSnap = await getDocs(collection(db, "projects"));
      let projectData = projectSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const taskSnap = await getDocs(collection(db, "tasks"));
      let taskData = taskSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const vendorSnap = await getDocs(collection(db, "vendors"));
      let vendorData = vendorSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (role === "EMPLOYEE") {
        taskData = taskData.filter((t) => t.taskAssignedTo?.includes(user.uid));
        projectData = projectData.filter((p) => p.projectAssignedTo?.includes(user.uid));
      }

      if (role === "CLIENT") {
        const phone = dbUser?.phone;
        projectData = projectData.filter(
          (p) => p.clientContactDetails?.clientNumber === phone
        );
        taskData = taskData.filter((t) =>
          projectData.some((p) => p.projectId === t.projectId)
        );
      }

      const userSnap = await getDocs(collection(db, "users"));
      const userData = userSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      setUsers(userData);

      setProjects(projectData);
      setTasks(taskData);
      setVendors(vendorData);
      setLoading(false);
    }

    fetchData();
  }, [role, user?.uid]);

  if (loading)
    return (
      <div className="p-6 animate-pulse text-gray-400">Loading dashboard...</div>
    );

  const todayTasks = tasks.filter((t) => isToday(t.taskDueDate));
  const overdueTasks = tasks.filter((t) => isOverdue(t.taskDueDate));

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Projects" value={projects.length} icon={Folder} link="/projects" />
        <Card title="Today" value={todayTasks.length} icon={CheckCircle2} link="/projects" />
        <Card title="Overdue" value={overdueTasks.length} icon={AlertTriangle} link="/projects" danger />
        <Card title="Vendors" value={vendors.length} icon={Users} link="/vendors" />
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-5 rounded-2xl border shadow-sm">
          <div className="font-semibold text-gray-700 mb-4">Tasks Focus</div>
          <TaskSection title="Today" tasks={todayTasks} users={users} />
          <TaskSection title="Overdue" tasks={overdueTasks} danger users={users} />
        </div>

        <QuickActions role={role} />
      </div>

      {/* PROJECTS */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <div className="font-semibold text-gray-700 mb-4">Projects</div>
        <div className="space-y-4">
          {projects.slice(0, 5).map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{p.projectName}</span>
                <span className="text-gray-500">{p.projectActualProgress || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${p.projectActualProgress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENTS =====
function Card({ title, value, icon: Icon, danger, link }) {
  const navigate = useNavigate();

  const clickEvent = () => {
    navigate(link)
  }
  
  return (
    <div onClick={clickEvent} className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition ${danger ? "border-red-300" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        {Icon && <Icon size={18} className="text-gray-400" />}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${danger ? "text-red-500" : "text-gray-800"}`}>
        {value}
      </div>
    </div>
  );
}

function TaskSection({ title, tasks, danger, users }) {
  const getUser = (uid) => users.find(u => u.uid === uid);

  return (
    <div className="mb-5">
      <div className={`text-sm font-medium mb-2 ${danger ? "text-red-500" : "text-gray-600"}`}>
        {title}
      </div>

      {tasks.length === 0 ? (
        <div className="text-xs text-gray-400">All clear 🎉</div>
      ) : (
        <div className="space-y-2">
          {tasks.sort((a, b) => new Date(a.taskDueDate) - new Date(b.taskDueDate))
                .slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {/* LEFT */}
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {t.taskName}
                </div>
                <div className="text-xs text-gray-400">
                  {t.projectId}
                </div>
                <div className="text-xs text-gray-400">
                  {t.taskCategory}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3">

                {/* 👤 ASSIGNED USERS */}
                <div className="flex -space-x-1">
                  {(t.taskAssignedTo || []).slice(0, 3).map((uid, i) => {
                    const u = getUser(uid);
                    const name = u?.name || "U";

                    return (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-blue-400 text-[10px] flex items-center justify-center border border-white text-white"
                        title={name}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}

                  {(t.taskAssignedTo || []).length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-[10px] flex items-center justify-center border border-white">
                      +{t.taskAssignedTo.length - 3}
                    </div>
                  )}
                </div>

                {/* 📅 DATE */}
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {t.taskDueDate}
                </span>

                {/* 🟡 PRIORITY */}
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.priority === "HIGH"
                      ? "bg-red-100 text-red-600"
                      : t.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {t.priority}
                </span>

                {/* 🔵 STATUS */}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    t.taskStatus === "done"
                      ? "bg-green-100 text-green-600"
                      : t.taskStatus === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {t.taskStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
