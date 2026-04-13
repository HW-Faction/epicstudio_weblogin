import Modal from "../components/Modal"

export default function ImagePreviewModal({ item, onClose, onDelete }) {
  if (!item) return null;
   return (
    <Modal onClose={onClose} size="lg" title="Preview">
      <div className="flex flex-col gap-4">
        <div className="flex justify-center bg-black rounded-lg overflow-hidden">
          <img
            src={item.url}
            className="max-h-[70vh] object-contain"
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700">
              {item.description || "No description"}
            </p>
          </div>

          <button
            onClick={onDelete}
            className="text-red-500 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
