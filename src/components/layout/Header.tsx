import { Shield, Settings } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-army-dark text-white shadow-md">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-army-green-400" />
          <span className="font-bold text-sm tracking-wider">군생활 관리</span>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
