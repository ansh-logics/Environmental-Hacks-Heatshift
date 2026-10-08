import { MOCK_WORKER_ID } from '@heatshift/shared';
import type { CheckInStatus, ReliefPointType, WorkType } from '@heatshift/shared';
import { createScriptLogger } from '../lib/logger';
import { closeDatabase, db } from './client';
import { checkIns, reliefPoints, users, workerProfiles } from './schema';

const log = createScriptLogger('seed');

const COORDINATOR_ID = '00000000-0000-4000-8000-0000000000c1';
const TEAMMATE_IDS = {
  guard: '00000000-0000-4000-8000-000000000002',
  construction: '00000000-0000-4000-8000-000000000003',
  vendor: '00000000-0000-4000-8000-000000000004',
} as const;

const demoUsers = [
  { id: MOCK_WORKER_ID, name: 'Ravi Kumar', role: 'worker' as const },
  { id: TEAMMATE_IDS.guard, name: 'Suresh Yadav', role: 'worker' as const },
  { id: TEAMMATE_IDS.construction, name: 'Arjun Prasad', role: 'worker' as const },
  { id: TEAMMATE_IDS.vendor, name: 'Meena Sharma', role: 'worker' as const },
  { id: COORDINATOR_ID, name: 'Delhi heat cell (demo)', role: 'coordinator' as const },
];

const profiles: Array<{
  userId: string;
  workType: WorkType;
  city: string;
  defaultShiftStart: string;
  defaultShiftEnd: string;
  waterAccess: 'none' | 'limited' | 'reliable';
  shadeAccess: 'none' | 'limited' | 'reliable';
}> = [
  {
    userId: MOCK_WORKER_ID,
    workType: 'delivery_rider',
    city: 'New Delhi',
    defaultShiftStart: '10:00',
    defaultShiftEnd: '20:00',
    waterAccess: 'limited',
    shadeAccess: 'none',
  },
  {
    userId: TEAMMATE_IDS.guard,
    workType: 'security_guard',
    city: 'New Delhi',
    defaultShiftStart: '08:00',
    defaultShiftEnd: '20:00',
    waterAccess: 'reliable',
    shadeAccess: 'limited',
  },
  {
    userId: TEAMMATE_IDS.construction,
    workType: 'construction',
    city: 'Dwarka',
    defaultShiftStart: '07:00',
    defaultShiftEnd: '17:00',
    waterAccess: 'limited',
    shadeAccess: 'none',
  },
  {
    userId: TEAMMATE_IDS.vendor,
    workType: 'street_vendor',
    city: 'Karol Bagh',
    defaultShiftStart: '11:00',
    defaultShiftEnd: '19:00',
    waterAccess: 'none',
    shadeAccess: 'limited',
  },
];

/** All coordinates are approximate public-place centroids and are DEMO data only. */
const points: Array<{
  id: string;
  name: string;
  type: ReliefPointType;
  latitude: number;
  longitude: number;
  address: string;
  verified: boolean;
  openingHours: string;
}> = [
  {
    id: '11111111-0000-4000-8000-000000000001',
    name: 'Drinking water point — CP Inner Circle ATRO',
    type: 'water',
    latitude: 28.6315,
    longitude: 77.2167,
    address: 'Inner Circle, near Radisson Blu, Connaught Place, New Delhi',
    verified: true,
    openingHours: '24x7',
  },
  {
    id: '11111111-0000-4000-8000-000000000002',
    name: 'Shade rest point — Karol Bagh pillar 12',
    type: 'shade',
    latitude: 28.6519,
    longitude: 77.1909,
    address: 'Pillar 12 footpath, Ajmal Khan Road, Karol Bagh, New Delhi',
    verified: false,
    openingHours: '10:00-20:00',
  },
  {
    id: '11111111-0000-4000-8000-000000000003',
    name: 'Community cooling room — MCD Shakti Nagar',
    type: 'cooling_space',
    latitude: 28.6789,
    longitude: 77.1916,
    address: 'Block 3, Shakti Nagar, Delhi Cantonment area, New Delhi',
    verified: true,
    openingHours: '09:00-18:00',
  },
  {
    id: '11111111-0000-4000-8000-000000000004',
    name: 'Heat clinic / emergency — AIIMS',
    type: 'clinic',
    latitude: 28.5672,
    longitude: 77.21,
    address: 'Dr S A Qumaruddin Road, Ansari Nagar, AIIMS, New Delhi',
    verified: true,
    openingHours: '24x7',
  },
  {
    id: '11111111-0000-4000-8000-000000000005',
    name: 'Subsidised canteen — Rajiv Chowk labour chowk',
    type: 'canteen',
    latitude: 28.6398,
    longitude: 77.2158,
    address: 'Rajiv Chowk, Connaught Place, New Delhi',
    verified: false,
    openingHours: '11:00-22:00',
  },
  {
    id: '11111111-0000-4000-8000-000000000006',
    name: 'Drinking water point — Nehru Place bus stand',
    type: 'water',
    latitude: 28.5499,
    longitude: 77.2841,
    address: 'Block B, Nehru Place, New Delhi',
    verified: false,
    openingHours: '06:00-22:00',
  },
  {
    id: '11111111-0000-4000-8000-000000000007',
    name: 'Shade canopy — Azadpur Mandi stall row',
    type: 'shade',
    latitude: 28.7115,
    longitude: 77.1871,
    address: 'Azadpur Mandi, National Highway 1, Azadpur, New Delhi',
    verified: false,
    openingHours: '04:00-16:00',
  },
  {
    id: '11111111-0000-4000-8000-000000000008',
    name: 'Cooling van — Dwarka Sector 10 market',
    type: 'cooling_space',
    latitude: 28.5921,
    longitude: 77.0465,
    address: 'Sector 10 Market, Dwarka, New Delhi',
    verified: false,
    openingHours: '12:00-18:00 (summer only)',
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600 * 1000);
}

const seedCheckIns: Array<{
  id: string;
  userId: string;
  status: CheckInStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}> = [
  {
    id: '22222222-0000-4000-8000-000000000001',
    userId: MOCK_WORKER_ID,
    status: 'need_water',
    latitude: 28.632,
    longitude: 77.219,
    createdAt: hoursAgo(0.2),
  },
  {
    id: '22222222-0000-4000-8000-000000000002',
    userId: TEAMMATE_IDS.guard,
    status: 'okay',
    latitude: 28.678,
    longitude: 77.19,
    createdAt: hoursAgo(0.7),
  },
  {
    id: '22222222-0000-4000-8000-000000000003',
    userId: TEAMMATE_IDS.construction,
    status: 'need_break',
    latitude: 28.593,
    longitude: 77.045,
    createdAt: hoursAgo(1.4),
  },
  {
    id: '22222222-0000-4000-8000-000000000004',
    userId: TEAMMATE_IDS.vendor,
    status: 'unwell',
    latitude: 28.652,
    longitude: 77.191,
    createdAt: hoursAgo(2.1),
  },
  {
    id: '22222222-0000-4000-8000-000000000005',
    userId: MOCK_WORKER_ID,
    status: 'okay',
    latitude: 28.63,
    longitude: 77.22,
    createdAt: hoursAgo(3.5),
  },
  {
    id: '22222222-0000-4000-8000-000000000006',
    userId: TEAMMATE_IDS.guard,
    status: 'need_water',
    latitude: 28.679,
    longitude: 77.192,
    createdAt: hoursAgo(5),
  },
  {
    id: '22222222-0000-4000-8000-000000000007',
    userId: TEAMMATE_IDS.construction,
    status: 'okay',
    latitude: null,
    longitude: null,
    createdAt: hoursAgo(8),
  },
  {
    id: '22222222-0000-4000-8000-000000000008',
    userId: MOCK_WORKER_ID,
    status: 'need_break',
    latitude: 28.628,
    longitude: 77.208,
    createdAt: hoursAgo(20),
  },
];

/**
 * Demo dataset only. Every insert is conflict-free on rerun so `docker compose up`
 * can call this on every boot.
 */
export async function runSeed(): Promise<void> {
  await db.insert(users).values(demoUsers).onConflictDoNothing({ target: users.id });

  await db
    .insert(workerProfiles)
    .values(profiles)
    .onConflictDoNothing({ target: workerProfiles.userId });

  await db
    .insert(reliefPoints)
    .values(points)
    .onConflictDoNothing({ target: reliefPoints.id });

  await db
    .insert(checkIns)
    .values(seedCheckIns)
    .onConflictDoNothing({ target: checkIns.id });

  log.info('demo dataset ready', {
    reliefPoints: points.length,
    checkIns: seedCheckIns.length,
    workers: profiles.length,
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runSeed()
    .then(() => closeDatabase())
    .catch((error: unknown) => {
      log.error('seed failed', error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
