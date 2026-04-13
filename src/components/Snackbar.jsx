export default function Snackbar({ message, type = "success" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm animate-slideUp ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
}