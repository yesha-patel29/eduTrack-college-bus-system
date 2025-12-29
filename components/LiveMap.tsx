
import React from 'react';
import { Bus } from '../types';

interface LiveMapProps {
  buses: Bus[];
  selectedBusId?: string | null;
}

const LiveMap: React.FC<LiveMapProps> = ({ buses, selectedBusId }) => {
  return (
    <div className="relative w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border-4 border-white shadow-inner">
      {/* Visual background for "Map" */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Main roads */}
          <path d="M 0 100 Q 250 150 500 100" stroke="gray" strokeWidth="20" fill="none" />
          <path d="M 250 0 L 250 400" stroke="gray" strokeWidth="20" fill="none" />
          <path d="M 50 350 L 450 350" stroke="gray" strokeWidth="20" fill="none" />
        </svg>
      </div>

      {/* Bus markers */}
      {buses.map(bus => {
        if (bus.status === 'offline') return null;
        
        // Simple mapping of lat/lng to UI coordinates for simulation
        // Lat usually 40.7xx, Lng usually -74.0xx
        const x = ((bus.lng + 74.03) / 0.06) * 100;
        const y = (1 - (bus.lat - 40.69) / 0.06) * 100;

        const isSelected = selectedBusId === bus.id;

        return (
          <div 
            key={bus.id}
            className={`absolute transition-all duration-1000 ease-linear ${isSelected ? 'z-20' : 'z-10'}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className={`relative -translate-x-1/2 -translate-y-1/2 group`}>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {bus.number}
              </div>
              
              {/* Pulse effect for selected */}
              {isSelected && (
                <div className="absolute inset-0 -m-2 bg-blue-500 rounded-full animate-ping opacity-25"></div>
              )}
              
              <div className={`
                p-2 rounded-lg shadow-lg border-2
                ${isSelected ? 'bg-blue-600 text-white border-blue-400 scale-125' : 'bg-yellow-400 text-blue-900 border-yellow-500'}
                transition-transform
              `}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}

      {/* Campus Labels */}
      <div className="absolute top-4 left-4 font-bold text-gray-400 select-none">NORTH CAMPUS</div>
      <div className="absolute bottom-4 right-4 font-bold text-gray-400 select-none">SOUTH STATION</div>
      <div className="absolute bottom-1/4 left-10 font-bold text-gray-400 select-none">ENGINEERING BLOCK</div>
    </div>
  );
};

export default LiveMap;
