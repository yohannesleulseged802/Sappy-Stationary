import Modal from "./Modal";
export default function ConfirmDialog({ open, title, message, onYes, onNo }: any) {
  return (
    <Modal open={open} onClose={onNo} title={title}>
      <p className="text-sm text-emerald-800/70">{message}</p>
      <div className="flex gap-2 mt-4">
        <button onClick={onNo} className="flex-1 rounded-xl border border-emerald-200 py-2">Cancel</button>
        <button onClick={onYes} className="flex-1 rounded-xl bg-red-500 text-white py-2">Confirm</button>
      </div>
    </Modal>
  );
}