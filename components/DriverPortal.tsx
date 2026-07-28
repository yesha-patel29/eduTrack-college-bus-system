
import React, { useState } from 'react';
import { User, Bus, Route } from '../types';

interface DriverPortalProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  onToggleTracking: (status: 'online' | 'offline') => void;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ user, buses, routes, onToggleTracking }) => {
  const driverBus = buses.find(b => b.driverId === user.id);
  const driverRoute = routes.find(r => r.id === driverBus?.routeId);
  const isTracking = driverBus?.status === 'online';

  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onToggleTracking(isTracking ? 'offline' : 'online');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-8 space-y-8">
      {/* Driver Identity Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
          </div>
          <h2 className="text-2xl font-black">{user.name}</h2>
          <p className="text-blue-100 font-medium">{user.phone}</p>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Assignment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Bus</span>
              <p className="text-xl font-black text-gray-800">{driverBus?.number ?? 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Route Number</span>
              <p className="text-xl font-black text-gray-800">{driverRoute?.number ?? 'N/A'}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-blue-900">Route: {driverRoute?.name}</h3>
            </div>
            <div className="relative pl-6 space-y-3 border-l-2 border-blue-200">
              {driverRoute?.stops.map((stop, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                  <p className="text-sm font-bold text-blue-800">{stop}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Controls */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-700">Tracking Status</span>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className={`font-black uppercase tracking-widest text-sm ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                  {isTracking ? 'Tracking ON' : 'Tracking OFF'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleToggle}
              disabled={loading}
              className={`
                w-full py-6 rounded-3xl font-black text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-50
                ${isTracking 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isTracking ? 'STOP TRACKING' : 'START TRACKING'
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 font-medium">
              Start tracking only when you begin your trip. <br/>
              Ensure your mobile GPS is enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Message */}
      <div className="bg-yellow-100 border-2 border-yellow-200 p-4 rounded-2xl flex items-start text-yellow-800">
        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        <p className="text-sm font-bold">Safety First: Do not use your phone while driving. Enable tracking before starting the engine.</p>
      </div>
    </div>
  );
};

export default DriverPortal;
