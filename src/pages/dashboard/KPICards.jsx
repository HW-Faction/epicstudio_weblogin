export default function KPICards({ role }) {
  const cards = [
    { label: "Projects", value: 12 },
    { label: "Tasks Today", value: 8 },
    { label: "Overdue", value: 3, danger: true },
    { label: role === "EMPLOYEE" ? "My Projects" : "Vendors", value: 5 },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border bg-white shadow-sm ${
            c.danger ? "border-red-300" : "border-gray-200"
          }`}
        >
          <div className="text-sm text-gray-500">{c.label}</div>
          <div className={`text-2xl font-semibold ${c.danger ? "text-red-500" : ""}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}