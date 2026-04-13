export default function Modal({ children, onClose, large, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className={`bg-white rounded-2xl p-6 ${large ? "w-[800px]" : "w-[400px]"}`}>
        <div className="flex mb-2">
          <p className="text-lg w-[80%] text-black ">{title}</p>
          <button className="flex w-[80%] justify-end" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}