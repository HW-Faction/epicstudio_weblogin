import { useNavigate } from "react-router-dom";
import {
  Folder,
  CheckSquare,
  Users,
  Settings,
  Truck,
  LogOut,
  LayoutDashboardIcon
} from "lucide-react";

export default function QuickActions({ role }) {
  const navigate = useNavigate();

  if (role === "EMPLOYEE" || role === "CLIENT") return null;

  return (
    <div className="relative z-10 bg-white p-4 rounded-xl border shadow-sm space-y-3">
      <div className="font-semibold">Quick Actions</div>

      <button
        type="button"
        className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium"
        onClick={() => navigate("/projects")}
      >
        + New Project 
      </button>

      <button
        type="button"
        className="w-full border py-2 rounded-lg text-sm font-medium"
        onClick={() => navigate("/tasks")}
      >
        + Add Task
      </button>

      {role === "ADMIN" && (
        <button
          type="button"
          className="w-full border py-2 rounded-lg text-sm font-medium"
          onClick={() => navigate("/users")}
        >
          + Add User
        </button>
      )}

      <button
        type="button"
        className="w-full border py-2 rounded-lg text-sm font-medium"
        onClick={() => navigate("/vendors")}
      >
        + Add Vendor
      </button>
    </div>
  );
}
