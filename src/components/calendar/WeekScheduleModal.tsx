import { useState, useMemo } from 'react';
import { format, startOfWeek, addWeeks, parseISO } from 'date-fns';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import Modal from '../shared/Modal';
import type { WeekSchedules } from '../../hooks/useWeekSchedule';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  enlistmentDate: string;
  weekSchedules: WeekSchedules;
  onSetWeekName: (sundayKey: string, name: string) => void;
  onRemoveWeekName: (sundayKey: string) => void;
}

/** 입대일부터 전역일(+18개월)까지의 모든 주 일요일 키 목록 생성 */
function getWeekKeys(enlistmentDate: string): string[] {
  if (!enlistmentDate) return [];
  const start = startOfWeek(parseISO(enlistmentDate), { weekStartsOn: 0 });
  const end   = addWeeks(start, 80); // 최대 ~18개월
  const keys: string[] = [];
  let cur = start;
  while (cur <= end) {
    keys.push(format(cur, 'yyyy-MM-dd'));
    cur = addWeeks(cur, 1);
  }
  return keys;
}

function weekLabel(sundayKey: string): string {
  const sun = parseISO(sundayKey);
  const sat = addWeeks(sun, 1);
  sat.setDate(sat.getDate() - 1);
  return `${format(sun, 'MM/dd')} ~ ${format(sat, 'MM/dd')}`;
}

/** 월별 그룹화 */
function groupByMonth(keys: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  keys.forEach(k => {
    const month = k.slice(0, 7); // yyyy-MM
    if (!groups[month]) groups[month] = [];
    groups[month].push(k);
  });
  return groups;
}

export default function WeekScheduleModal({
  isOpen, onClose, enlistmentDate, weekSchedules, onSetWeekName, onRemoveWeekName,
}: Props) {
  const [editKey,  setEditKey]  = useState<string | null>(null);
  const [editVal,  setEditVal]  = useState('');
  const [addKey,   setAddKey]   = useState<string | null>(null);
  const [addVal,   setAddVal]   = useState('');

  const weekKeys = useMemo(() => getWeekKeys(enlistmentDate), [enlistmentDate]);
  const grouped  = useMemo(() => groupByMonth(weekKeys), [weekKeys]);

  const startEdit = (key: string) => {
    setEditKey(key); setEditVal(weekSchedules[key] || '');
    setAddKey(null); setAddVal('');
  };
  const saveEdit = () => {
    if (editKey) { if (editVal.trim()) onSetWeekName(editKey, editVal.trim()); else onRemoveWeekName(editKey); }
    setEditKey(null); setEditVal('');
  };
  const startAdd = (key: string) => {
    setAddKey(key); setAddVal('');
    setEditKey(null); setEditVal('');
  };
  const saveAdd = () => {
    if (addKey && addVal.trim()) onSetWeekName(addKey, addVal.trim());
    setAddKey(null); setAddVal('');
  };

  // named 주 + 현재 달의 주만 표시하도록
  const namedKeys = new Set(Object.keys(weekSchedules));
  const todayMonth = format(new Date(), 'yyyy-MM');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="주간일정 관리">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([month, keys]) => {
          // 이름 있는 주 또는 현재 달만 표시
          const visibleKeys = keys.filter(k => namedKeys.has(k) || month === todayMonth || month >= todayMonth.slice(0,4));
          if (visibleKeys.length === 0) return null;
          return (
            <div key={month}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {month.slice(0,4)}년 {month.slice(5,7)}월
              </p>
              <div className="space-y-2">
                {visibleKeys.map(key => {
                  const name = weekSchedules[key];
                  const isEditing = editKey === key;
                  const isAdding  = addKey  === key;
                  return (
                    <div key={key} className={`rounded-xl border px-3 py-2.5 ${name ? 'bg-army-green-50 border-army-green-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs text-gray-500">{weekLabel(key)}</span>
                          {name && !isEditing && (
                            <span className="ml-2 text-xs font-bold text-army-green-700">{name}</span>
                          )}
                        </div>
                        {!isEditing && !isAdding && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => name ? startEdit(key) : startAdd(key)}
                              className="p-1.5 text-gray-400 hover:text-army-green-600 hover:bg-army-green-50 rounded-lg transition-colors">
                              <Pencil size={12}/>
                            </button>
                            {name && (
                              <button onClick={() => onRemoveWeekName(key)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={12}/>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {(isEditing || isAdding) && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            autoFocus
                            type="text"
                            value={isEditing ? editVal : addVal}
                            onChange={e => isEditing ? setEditVal(e.target.value) : setAddVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') isEditing ? saveEdit() : saveAdd(); if (e.key === 'Escape') { setEditKey(null); setAddKey(null); } }}
                            placeholder="예: 인성교육주간"
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-army-green-400"
                          />
                          <button onClick={isEditing ? saveEdit : saveAdd}
                            className="p-1.5 bg-army-green-600 text-white rounded-lg hover:bg-army-green-700 transition-colors">
                            <Check size={12}/>
                          </button>
                          <button onClick={() => { setEditKey(null); setAddKey(null); }}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                            <X size={12}/>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
