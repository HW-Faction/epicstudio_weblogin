import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  Folder,
  CheckSquare,
  Users,
  Settings,
  Truck,
  LogOut,
  LayoutDashboardIcon
} from "lucide-react";
import logo from "../../public/logo.png"

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, dbUser } = useAuth();

  const name = dbUser?.name || user?.displayName || "User";
  const email = user?.email || dbUser?.email || "No Email";
  const role = dbUser?.role || "EMPLOYEE";

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const navItem = (to, label, Icon) => {
    const active = location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
          active
            ? "bg-primary text-white shadow"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white flex flex-col justify-between shadow-lg">
        <div>
          {/* LOGO */}
          <div className="w-full flex justify-center items-center">
            <img src={logo} alt="logo" className="h-32" />
          </div>

          {/* USER INFO */}
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <img
              src={
                dbUser?.photoURL ||
                "https://ui-avatars.com/api/?name=" + encodeURIComponent(name)
              }
              alt="profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-700"
            />
            <div className="overflow-hidden">
              <div className="font-semibold truncate">{name}</div>
              <div className="text-xs text-gray-400 truncate">{email}</div>
              <div className="text-[10px] text-gray-500">{role}</div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="p-3 space-y-1">
            {navItem("/dashboard", "Dashboard", LayoutDashboardIcon)}
            {navItem("/projects", "Projects", Folder)}
            {navItem("/tasks", "Tasks", CheckSquare)}
            {navItem("/vendors", "Vendors", Truck)}
            {navItem("/users", "Users", Users)}
            {navItem("/settings", "Settings", Settings)}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="text-xs text-gray-400">{today}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-primary py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            <LogOut size={18} className="shrink-0" />
            <div>Logout</div>
          </button>   
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="text-lg font-semibold text-gray-700">
            Epic Studio - IDS
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{today}</span>

            <img
              src={
                dbUser?.photoURL ||
                "https://ui-avatars.com/api/?name=" + encodeURIComponent(name)
              }
              alt="profile"
              className="w-9 h-9 rounded-full object-cover border"
            />
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
