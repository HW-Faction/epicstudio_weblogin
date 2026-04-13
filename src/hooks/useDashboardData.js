import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function useDashboardData() {
  const { user, dbUser } = useAuth();
  const role = dbUser?.role;

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // ===== PROJECTS =====
        const projectSnap = await getDocs(collection(db, "projects"));
        let projectData = projectSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ===== TASKS =====
        const taskSnap = await getDocs(collection(db, "tasks"));
        let taskData = taskSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ===== VENDORS =====
        const vendorSnap = await getDocs(collection(db, "vendors"));
        let vendorData = vendorSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ===== ROLE FILTERING =====

        if (role === "EMPLOYEE") {
          taskData = taskData.filter(t =>
            t.taskAssignedTo?.includes(user.uid)
          );

          projectData = projectData.filter(p =>
            p.projectAssignedTo?.includes(user.uid)
          );
        }

        if (role === "CLIENT") {
          const phone = dbUser?.phone;

          projectData = projectData.filter(
            p => p.clientContactDetails?.clientNumber === phone
          );

          taskData = taskData.filter(t =>
            projectData.some(p => p.projectId === t.projectId)
          );
        }

        setProjects(projectData);
        setTasks(taskData);
        setVendors(vendorData);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role, user?.uid]);

  return { projects, tasks, vendors, loading };
}