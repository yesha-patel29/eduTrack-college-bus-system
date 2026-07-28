
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, User, Bus, Route, Driver } from './types';
import { INITIAL_BUSES, ROUTES, DRIVERS } from './mockData';
import RoleSelector from './components/RoleSelector';
import PassengerPortal from './components/PassengerPortal';
import ManagerPortal from './components/ManagerPortal';
import DriverPortal from './components/DriverPortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [routes, setRoutes] = useState<Route[]>(ROUTES);
  const [drivers, setDrivers] = useState<Driver[]>(DRIVERS);

  // Simulation: Move online buses randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        if (bus.status === 'online') {
          return {
            ...bus,
            lat: bus.lat + (Math.random() - 0.5) * 0.001,
            lng: bus.lng + (Math.random() - 0.5) * 0.001,
            lastUpdated: new Date().toISOString()
          };
        }
        return bus;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const updateBusStatus = (busId: string, status: 'online' | 'offline') => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, status } : b));
  };

  const updateDriverInfo = (driverId: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updates } : d));
  };

  if (!currentUser) {
    return <RoleSelector onSelectRole={handleLogin} />;
  }

  // If driver name was updated by manager, reflect it in the current user object if current user is that driver
  const effectiveUser = currentUser.role === UserRole.DRIVER 
    ? { ...currentUser, name: drivers.find(d => d.id === currentUser.id)?.name || currentUser.name }
    : currentUser;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">EduTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium opacity-90 hidden sm:inline">
            Logged in as <span className="text-yellow-400 capitalize">{effectiveUser.name}</span>
          </span>
          <button 
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {effectiveUser.role === UserRole.PASSENGER && (
          <PassengerPortal 
            user={effectiveUser} 
            buses={buses} 
            routes={routes} 
            drivers={drivers}
          />
        )}
        {effectiveUser.role === UserRole.MANAGER && (
          <ManagerPortal 
            user={effectiveUser} 
            buses={buses} 
            routes={routes} 
            drivers={drivers}
            onUpdateBusStatus={updateBusStatus}
            onUpdateDriverInfo={updateDriverInfo}
          />
        )}
        {effectiveUser.role === UserRole.DRIVER && (
          <DriverPortal 
            user={effectiveUser} 
            buses={buses} 
            routes={routes}
            onToggleTracking={(status) => {
              const bus = buses.find(b => b.driverId === effectiveUser.id);
              if (bus) updateBusStatus(bus.id, status);
            }}
          />
        )}
      </main>
      
      <footer className="bg-white border-t p-4 text-center text-xs text-gray-500">
        &copy; 2024 College Transportation Authority. Real-time GPS enabled.
      </footer>
    </div>
  );
};

export default App;
