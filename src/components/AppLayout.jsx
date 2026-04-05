import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();

  // SAFE FALLBACKS (no crashes ever)
  const name = dbUser?.name || user?.displayName || "User";
  const email = user?.email || dbUser?.email || "No Email";
  const role = dbUser?.role || "EMPLOYEE";

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-light">

      {/* SIDEBAR */}
      <div className="w-64 bg-dark text-white flex flex-col justify-between">

        {/* Top Section */}
        <div>
          {/* Logo */}
          <div className="p-4 text-2xl font-bold border-b border-gray-700">
            EpicStudio
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-gray-400">{email}</div>
            <div className="text-xs text-gray-500 mt-1">{role}</div>
          </div>

          {/* Navigation */}
          <div className="p-2 space-y-2">

            {/* <Link
              to="/dashboard"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Dashboard
            </Link> */}

            <Link
              to="/projects"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Projects
            </Link>

            {/* <Link
              to="/tasks"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Tasks
            </Link> */}

            <Link
              to="/vendors"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Vendors
            </Link>

            {/* <Link
              to="/users"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Users
            </Link> */}

          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-primary py-2 rounded hover:opacity-90"
          >
            Logout
          </button>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>

    </div>
  );
}