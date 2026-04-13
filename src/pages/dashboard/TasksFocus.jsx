export default function TasksFocus({ role }) {
  const tasks = [
    { title: "Fix UI bug", project: "Website", due: "Today", priority: "high" },
    { title: "Update docs", project: "Docs", due: "Tomorrow", priority: "medium" },
  ];

  const badge = (p) => {
    if (p === "high") return "bg-red-100 text-red-600";
    if (p === "medium") return "bg-yellow-100 text-yellow-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="font-semibold mb-4">Tasks</div>

      {tasks.length === 0 ? (
        <div className="text-gray-500 text-sm">No tasks today 🎉</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">{t.project}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{t.due}</span>
                <span className={`text-xs px-2 py-1 rounded ${badge(t.priority)}`}>
                  {t.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}