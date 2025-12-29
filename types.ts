
export enum UserRole {
  PASSENGER = 'PASSENGER',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
  GUEST = 'GUEST'
}

export enum PassengerSubRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  PARENT = 'PARENT'
}

export interface Bus {
  id: string;
  number: string;
  routeId: string;
  driverId: string;
  status: 'online' | 'offline';
  capacity: number;
  lat: number;
  lng: number;
  lastUpdated: string;
}

export interface Route {
  id: string;
  number: string;
  name: string;
  stops: string[];
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  busId: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  surname?: string;
  collegeId?: string;
  subRole?: PassengerSubRole;
  phone?: string;
}
