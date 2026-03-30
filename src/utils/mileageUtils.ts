import type { MileageEntry } from '../types';

let idCounter = 0;
export function generateId(): string {
  return `${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function groupEntriesByDate(entries: MileageEntry[]): Map<string, MileageEntry[]> {
  const map = new Map<string, MileageEntry[]>();
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const entry of sorted) {
    const group = map.get(entry.date) ?? [];
    group.push(entry);
    map.set(entry.date, group);
  }
  return map;
}

export { MILEAGE_AMOUNTS, MILEAGE_LABELS, createMileageEntry } from '../logic/mileageLogic';
