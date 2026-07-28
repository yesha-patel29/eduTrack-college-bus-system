
import React, { useState } from 'react';
import { User, Bus, Route, Driver } from '../types';
import LiveMap from './LiveMap';

interface PassengerPortalProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  drivers: Driver[];
}

const PassengerPortal: React.FC<PassengerPortalProps> = ({ user, buses, routes, drivers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const foundBus = buses.find(b => {
      const route = routes.find(r => r.id === b.routeId);
      return route?.number === searchQuery || b.number.includes(searchQuery);
    });
    if (foundBus) {
      setSelectedBus(foundBus);
    } else {
      alert("No active bus found for this route number.");
    }
  };

  const getRouteForBus = (bus: Bus) => routes.find(r => r.id === bus.routeId);
  const getDriverForBus = (bus: Bus) => drivers.find(d => d.id === bus.driverId);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hello, {user.name}!</h2>
          <p className="text-gray-500">Track your college bus in real-time.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter Route Number (e.g., 101)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-700">Live Campus Map</h3>
            <span className="flex items-center text-green-500 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live Updates
            </span>
          </div>
          <LiveMap buses={buses} selectedBusId={selectedBus?.id} />
          
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {routes.map(route => (
                <button 
                  key={route.id}
                  onClick={() => {
                    setSearchQuery(route.number);
                    const activeBus = buses.find(b => b.routeId === route.id && b.status === 'online');
                    if (activeBus) setSelectedBus(activeBus);
                  }}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-sm font-medium transition-colors text-center border border-gray-100"
                >
                  Route {route.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-700">Bus Information</h3>
          {selectedBus ? (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-600 p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs uppercase font-bold opacity-75">Active Bus</span>
                    <h4 className="text-3xl font-black">{selectedBus.number}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedBus.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}>
                    {selectedBus.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm font-medium opacity-90">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Last: {new Date(selectedBus.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Route Details</h5>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-bold mr-3">
                      {getRouteForBus(selectedBus)?.number}
                    </div>
                    <p className="font-bold text-gray-800">{getRouteForBus(selectedBus)?.name}</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Assigned Stops</h5>
                  <div className="relative pl-6 space-y-4 border-l-2 border-dashed border-gray-200 ml-2">
                    {getRouteForBus(selectedBus)?.stops.map((stop, idx) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-green-500' : (idx === (getRouteForBus(selectedBus)?.stops.length ?? 0) - 1 ? 'bg-red-500' : 'bg-blue-400')}`}></div>
                        <p className="text-sm font-semibold text-gray-700">{stop}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Driver Contact</h5>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-800">{getDriverForBus(selectedBus)?.name}</p>
                      <p className="text-xs text-gray-500">{getDriverForBus(selectedBus)?.phone}</p>
                    </div>
                    <a href={`tel:${getDriverForBus(selectedBus)?.phone}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.47 5.47L11 14.043a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 3z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <p className="font-medium">Enter a route number or click a route from the list to see real-time details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerPortal;
