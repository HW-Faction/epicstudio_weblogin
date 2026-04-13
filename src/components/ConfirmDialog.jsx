import Modal from "../components/Modal"
export default function ConfirmDialog({ onConfirm, onCancel, message, title }) {
  return (
    <Modal onClose={onCancel} title={title}>
      <p className="text-sm text-black mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="text-gray-500">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}