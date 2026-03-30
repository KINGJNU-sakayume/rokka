import { LayoutDashboard, CalendarDays, Star } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={22} /> },
  { id: 'calendar',  label: '달력',    icon: <CalendarDays size={22} /> },
  { id: 'mileage',   label: '마일리지', icon: <Star size={22} /> },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                isActive ? 'text-army-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-army-green-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
