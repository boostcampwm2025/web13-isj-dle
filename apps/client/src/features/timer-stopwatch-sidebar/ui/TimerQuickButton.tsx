interface TimerQuickButtonProps {
  label: string;
  onClick: () => void;
}

export const TimerQuickButton = ({ label, onClick }: TimerQuickButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
    >
      {label}
    </button>
  );
};
