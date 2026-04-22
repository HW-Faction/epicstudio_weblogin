export default function TabSwitch({ value, onChange, options }) {
  return (
    <div className="inline-flex bg-gray-200 rounded-xl">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 text-sm rounded-lg transition-all ${
            value === opt.value
              ? "bg-primary  text-white"
              : "text-black"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}