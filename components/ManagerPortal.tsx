
import React, { useState, useMemo } from 'react';
import { User, Bus, Route, Driver } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ManagerPortalProps {
  user: User;
  buses: Bus[];
  routes: Route[];
  drivers: Driver[];
  onUpdateBusStatus: (busId: string, status: 'online' | 'offline') => void;
  onUpdateDriverInfo: (driverId: string, updates: Partial<Driver>) => void;
}

const ManagerPortal: React.FC<ManagerPortalProps> = ({ user, buses, routes, drivers, onUpdateBusStatus, onUpdateDriverInfo }) => {
  const [selectedItem, setSelectedItem] = useState<{ type: 'bus' | 'route', id: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for edit fields to prevent unnecessary parent re-renders while typing
  const [editFields, setEditFields] = useState({
    busNumber: '',
    driverName: '',
    driverPhone: '',
    status: 'offline' as 'online' | 'offline'
  });

  const stats = useMemo(() => {
    const onlineCount = buses.filter(b => b.status === 'online').length;
    return {
      totalBuses: buses.length,
      totalRoutes: routes.length,
      liveBuses: onlineCount,
      offlineBuses: buses.length - onlineCount
    };
  }, [buses, routes]);

  const chartData = routes.map(r => ({
    name: `R ${r.number}`,
    buses: buses.filter(b => b.routeId === r.id).length
  }));

  const activeDetail = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'bus') {
      const bus = buses.find(b => b.id === selectedItem.id);
      const route = routes.find(r => r.id === bus?.routeId);
      const driver = drivers.find(d => d.id === bus?.driverId);
      return { ...bus, route, driver };
    } else {
      const route = routes.find(r => r.id === selectedItem.id);
      const assignedBuses = buses.filter(b => b.routeId === route?.id);
      return { ...route, assignedBuses };
    }
  }, [selectedItem, buses, routes, drivers]);

  const handleStartEditing = () => {
    if (activeDetail && selectedItem?.type === 'bus') {
      const busDetail = activeDetail as any;
      setEditFields({
        busNumber: busDetail.number,
        driverName: busDetail.driver?.name || '',
        driverPhone: busDetail.driver?.phone || '',
        status: busDetail.status
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (activeDetail && selectedItem?.type === 'bus') {
      const busDetail = activeDetail as any;
      
      // Update Bus Status if changed
      if (editFields.status !== busDetail.status) {
        onUpdateBusStatus(busDetail.id, editFields.status);
      }

      // Update Driver Info if changed
      if (busDetail.driver) {
        onUpdateDriverInfo(busDetail.driver.id, {
          name: editFields.driverName,
          phone: editFields.driverPhone
        });
      }

      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Buses', value: stats.totalBuses, color: 'blue' },
          { label: 'Total Routes', value: stats.totalRoutes, color: 'purple' },
          { label: 'Live Buses', value: stats.liveBuses, color: 'green', pulse: true },
          { label: 'Offline', value: stats.offlineBuses, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
            <div className="flex items-center">
              {stat.pulse && <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping"></span>}
              <span className={`text-3xl font-black text-${stat.color}-600`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fleet & Route Lists */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Fleet Monitor</h3>
              <div className="flex space-x-2">
                <button className="text-xs font-bold text-blue-600 hover:underline">Download Report</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Bus ID</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Sync</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buses.map(bus => (
                    <tr key={bus.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-800">{bus.number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {routes.find(r => r.id === bus.routeId)?.number} - {routes.find(r => r.id === bus.routeId)?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${bus.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {bus.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(bus.lastUpdated).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setSelectedItem({ type: 'bus', id: bus.id });
                            setIsEditing(false);
                          }}
                          className="text-blue-600 font-bold text-xs hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Bus Distribution by Route</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="buses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action / Detail Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Inspector</h3>
              {activeDetail && selectedItem?.type === 'bus' && (
                <button 
                  onClick={isEditing ? () => setIsEditing(false) : handleStartEditing}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Info'}
                </button>
              )}
            </div>

            {selectedItem ? (
              <div className="space-y-6">
                <div className="text-center pb-6 border-b">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <h4 className="text-2xl font-black text-gray-800">
                    {selectedItem.type === 'bus' ? (activeDetail as any).number : (activeDetail as any).number}
                  </h4>
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-widest">{selectedItem.type} Details</p>
                </div>

                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-3">Bus Management</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Operational Status</label>
                            <select 
                              className="w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm"
                              value={editFields.status}
                              onChange={(e) => setEditFields({...editFields, status: e.target.value as any})}
                            >
                              <option value="online">Online / Active</option>
                              <option value="offline">Offline / Garage</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <p className="text-[10px] font-bold text-yellow-600 uppercase mb-3">Driver Information</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Driver Full Name</label>
                            <input 
                              type="text" 
                              required
                              className="w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm" 
                              value={editFields.driverName}
                              onChange={(e) => setEditFields({...editFields, driverName: e.target.value})}
                              placeholder="Enter driver name"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
                            <input 
                              type="text" 
                              className="w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm" 
                              value={editFields.driverPhone}
                              onChange={(e) => setEditFields({...editFields, driverPhone: e.target.value})}
                              placeholder="+1 555-0000"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95" 
                        onClick={handleSave}
                      >
                        Apply System Updates
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                          <p className={`text-xs font-bold ${(activeDetail as any).status === 'online' ? 'text-green-600' : 'text-red-600'}`}>{(activeDetail as any).status?.toUpperCase() ?? 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Capacity</p>
                          <p className="text-xs font-bold text-gray-800">40 Seats</p>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Assigned Personnel</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs mr-3">
                            {(activeDetail as any).driver?.name?.charAt(0) ?? 'D'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-900">{(activeDetail as any).driver?.name ?? 'Unassigned'}</p>
                            <p className="text-[10px] text-blue-600">{(activeDetail as any).driver?.phone ?? '--'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Route Sequence</p>
                        <ul className="text-xs space-y-2">
                          {(activeDetail as any).route?.stops?.map((stop: string, i: number) => (
                            <li key={i} className="flex items-center text-gray-600">
                              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></span>
                              {stop}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <p className="text-sm font-medium">Select a bus from the monitor list to view detailed telemetry and manage its properties.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPortal;
