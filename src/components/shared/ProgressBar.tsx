interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  colorClass = 'bg-army-green',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
