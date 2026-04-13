import Modal from "../components/Modal"

export default function UploadModal({
  file,
  setFile,
  description,
  setDescription,
  clientVisible,
  setClientVisible,
  uploading,
  progress,
  onUpload,
  onClose,
}) {
    return (
    <Modal title="Upload Progress" onClose={onClose}>
      <div className="space-y-4">

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {file && (
          <img
            src={URL.createObjectURL(file)}
            className="h-40 w-full object-cover rounded-lg"
          />
        )}

        <textarea
          placeholder="Add description"
          className="w-full border rounded-lg p-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-between text-sm">
          <span>Visible to Client</span>
          <input
            type="checkbox"
            checked={clientVisible}
            onChange={(e) => setClientVisible(e.target.checked)}
          />
        </div>

        {uploading && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className="bg-primary h-2 rounded"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">Uploading {progress}%</p>
          </div>
        )}

         <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={onUpload}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Upload
          </button>
        </div>
      </div>
    </Modal>
  );
}
