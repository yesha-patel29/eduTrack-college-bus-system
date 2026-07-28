
import { Bus, Route, Driver } from './types';

export const ROUTES: Route[] = [
  { id: 'r1', number: '101', name: 'Downtown Express', stops: ['Main Square', 'Library', 'Engineering Block', 'Hostel A'] },
  { id: 'r2', number: '102', name: 'North Campus Shuttle', stops: ['Railway Station', 'Medical College', 'Science Block', 'Admin Office'] },
  { id: 'r3', number: '201', name: 'South Suburban', stops: ['Ring Road', 'Sector 5', 'Commerce Block', 'Cafeteria'] },
  { id: 'r4', number: '305', name: 'East Ring', stops: ['East Gate', 'Arts Block', 'Gymnasium', 'Hostel B'] },
];

export const DRIVERS: Driver[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `d${i + 1}`,
  name: `Driver ${String.fromCharCode(65 + i)}`,
  phone: `+1 555-010${i + 10}`,
  busId: `b${i + 1}`,
}));

export const INITIAL_BUSES: Bus[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `b${i + 1}`,
  number: `EDU-${100 + i}`,
  routeId: ROUTES[i % ROUTES.length].id,
  driverId: `d${i + 1}`,
  status: Math.random() > 0.4 ? 'online' : 'offline',
  capacity: 40,
  lat: 40.7128 + (Math.random() - 0.5) * 0.05,
  lng: -74.0060 + (Math.random() - 0.5) * 0.05,
  lastUpdated: new Date().toISOString(),
}));
