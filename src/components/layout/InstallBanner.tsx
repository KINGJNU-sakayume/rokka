import { Download, X } from 'lucide-react';
import { useState } from 'react';

interface InstallBannerProps {
  onInstall: () => Promise<void>;
}

export default function InstallBanner({ onInstall }: InstallBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-army-green-900/80 border-b border-army-green-700/40 backdrop-blur-sm">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-2.5">
        <Download size={16} className="text-army-green-400 shrink-0" />
        <p className="flex-1 text-xs text-army-green-200">
          홈 화면에 추가하면 앱처럼 사용할 수 있어요
        </p>
        <button
          onClick={onInstall}
          className="shrink-0 text-xs font-semibold text-white bg-army-green-600 hover:bg-army-green-500 transition-colors px-3 py-1.5 rounded-lg"
        >
          설치
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-gray-400 hover:text-white transition-colors p-0.5"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
