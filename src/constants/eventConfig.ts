import type { EventType } from '../types';

export interface EventConfig {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}

export const EVENT_CONFIG: Record<EventType, EventConfig> = {
  vacation:          { label: '휴가',    shortLabel: '휴가',  color: '#3B82F6', bgColor: 'bg-blue-500',    textColor: 'text-blue-700',    dotColor: 'bg-blue-500'    },
  duty:              { label: '근무',    shortLabel: '근무',  color: '#6B7280', bgColor: 'bg-gray-500',    textColor: 'text-gray-700',    dotColor: 'bg-gray-500'    },
  after_duty_sleep:  { label: '근무취침', shortLabel: '취침',  color: '#8B5CF6', bgColor: 'bg-violet-500',  textColor: 'text-violet-700',  dotColor: 'bg-violet-500'  },
  weekday_outing:    { label: '평일외출', shortLabel: '평외',  color: '#F59E0B', bgColor: 'bg-amber-500',   textColor: 'text-amber-700',   dotColor: 'bg-amber-500'   },
  weekend_outing:    { label: '주말외출', shortLabel: '주외',  color: '#F97316', bgColor: 'bg-orange-500',  textColor: 'text-orange-700',  dotColor: 'bg-orange-500'  },
  weekend_overnight: { label: '주말외박', shortLabel: '외박',  color: '#EC4899', bgColor: 'bg-pink-500',    textColor: 'text-pink-700',    dotColor: 'bg-pink-500'    },
  church:            { label: '교회',    shortLabel: '교회',  color: '#10B981', bgColor: 'bg-emerald-500', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
  night_watch:       { label: '불침번',  shortLabel: '불침',  color: '#1E3A8A', bgColor: 'bg-blue-900',    textColor: 'text-blue-900',    dotColor: 'bg-blue-900'    },
  full_combat_rest:  { label: '전투휴무', shortLabel: '전휴',  color: '#14B8A6', bgColor: 'bg-teal-500',    textColor: 'text-teal-700',    dotColor: 'bg-teal-500'    },
  half_combat_rest:  { label: '반투휴무', shortLabel: '반휴',  color: '#2DD4BF', bgColor: 'bg-teal-400',    textColor: 'text-teal-600',    dotColor: 'bg-teal-400'    },
  dining_cleaning:   { label: '식당청소', shortLabel: '식당',  color: '#F97316', bgColor: 'bg-orange-400',  textColor: 'text-orange-800',  dotColor: 'bg-orange-400'  },
  guard_duty:        { label: '경계',    shortLabel: '경계',  color: '#7C3AED', bgColor: 'bg-violet-700',  textColor: 'text-violet-900',  dotColor: 'bg-violet-700'  }, // [NEW]
};

export const WORKING_DAY_DEDUCTION_TYPES: EventType[] = [
  'vacation',
  'after_duty_sleep',
  'full_combat_rest',
];
