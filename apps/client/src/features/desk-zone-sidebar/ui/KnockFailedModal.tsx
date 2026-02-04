interface KnockFailedModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const KnockFailedModal = ({ isOpen, message, onClose }: KnockFailedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">알림</h3>
        <p className="mb-6 text-sm text-gray-500">{message}</p>
        <div className="flex">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
