export default function ProjectsOverview({ role }) {
  const projects = [
    { name: "Website Redesign", progress: 60 },
    { name: "Mobile App", progress: 30 },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="font-semibold mb-4">Projects</div>

      <div className="space-y-4">
        {projects.map((p, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span>{p.name}</span>
              <span>{p.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className="bg-primary h-2 rounded"
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
