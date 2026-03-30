import Dexie, { type Table } from 'dexie';
import type { VacationData, MileageData, ScheduleData, ChurchCheckData } from '../types';
import type { BasicSkillData } from '../types/basicSkill';

export interface AppDataRecord {
  userId: string;          // primary key — always 'local_user'
  vacation: VacationData;
  mileage: MileageData;
  schedule: ScheduleData;
  church_check: ChurchCheckData;
  basic_skill: BasicSkillData;
  week_schedules: Record<string, string>;
}

export class AppDatabase extends Dexie {
  appData!: Table<AppDataRecord, string>;

  constructor() {
    super('SoldierAppDB');
    this.version(1).stores({
      appData: 'userId',
    });
  }
}

export const db = new AppDatabase();
export const LOCAL_USER_ID = 'local_user';
