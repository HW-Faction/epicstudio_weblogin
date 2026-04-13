export default function QuickActions({ role }) {
  if (role === "EMPLOYEE" || role === "CLIENT") return null;

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
      <div className="font-semibold">Quick Actions</div>

      <button className="w-full bg-primary text-white py-2 rounded">+ New Project</button>
      <button className="w-full border py-2 rounded">+ Add Task</button>
      {role === "ADMIN" && (
        <button className="w-full border py-2 rounded">+ Add User</button>
      )}
    </div>
  );
}