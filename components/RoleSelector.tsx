
import React, { useState } from 'react';
import { UserRole, PassengerSubRole, User } from '../types';

interface RoleSelectorProps {
  onSelectRole: (user: User) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  const [view, setView] = useState<'selection' | 'login' | 'register'>('selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Form states
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [subRole, setSubRole] = useState<PassengerSubRole>(PassengerSubRole.STUDENT);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === UserRole.PASSENGER) {
      setView('register');
    } else {
      setView('login');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Common password check
    if (selectedRole !== UserRole.DRIVER) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (view === 'register' && password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    const newUser: User = {
      id: selectedRole === UserRole.DRIVER ? 'd1' : (selectedRole === UserRole.MANAGER ? 'mgr1' : 'p1'),
      role: selectedRole!,
      name: name || (selectedRole === UserRole.MANAGER ? 'Admin' : 'User'),
      surname: surname,
      collegeId: collegeId,
      subRole: subRole,
      phone: phone
    };
    onSelectRole(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-yellow-400 p-8 text-center">
          <div className="inline-block p-4 bg-blue-900 rounded-full mb-4 shadow-inner">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-900">EduTrack</h2>
          <p className="text-blue-800 font-medium">College Bus Tracking System</p>
        </div>

        <div className="p-8">
          {view === 'selection' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 text-center mb-6">Select your role to continue</h3>
              <button 
                onClick={() => handleRoleSelection(UserRole.PASSENGER)}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold text-gray-800">Passenger</p>
                  <p className="text-sm text-gray-500">Student, Faculty, or Parent</p>
                </div>
              </button>
              <button 
                onClick={() => handleRoleSelection(UserRole.DRIVER)}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold text-gray-800">Driver</p>
                  <p className="text-sm text-gray-500">Share live GPS location</p>
                </div>
              </button>
              <button 
                onClick={() => handleRoleSelection(UserRole.MANAGER)}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold text-gray-800">Bus Manager</p>
                  <p className="text-sm text-gray-500">Fleet control and reporting</p>
                </div>
              </button>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button 
                type="button" 
                onClick={() => setView('selection')}
                className="text-sm text-blue-600 font-semibold mb-4 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                Back to Selection
              </button>
              
              <h3 className="text-2xl font-bold text-gray-800">
                {view === 'register' ? 'Registration' : 'Login'}
              </h3>
              <p className="text-gray-500 text-sm">
                Signing in as <span className="font-bold text-blue-600 capitalize">{selectedRole?.toLowerCase()}</span>
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg">
                  {error}
                </div>
              )}

              {view === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase">First Name</label>
                      <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase">Surname</label>
                      <input required value={surname} onChange={e => setSurname(e.target.value)} type="text" className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase">Role</label>
                    <select value={subRole} onChange={e => setSubRole(e.target.value as PassengerSubRole)} className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value={PassengerSubRole.STUDENT}>Student</option>
                      <option value={PassengerSubRole.FACULTY}>Faculty</option>
                      <option value={PassengerSubRole.PARENT}>Parent</option>
                    </select>
                  </div>
                </>
              )}

              {selectedRole === UserRole.DRIVER ? (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase">Mobile Number</label>
                  <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+1..." className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase">College ID Number</label>
                    <input required value={collegeId} onChange={e => setCollegeId(e.target.value)} type="text" className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase">Password (Min 8 characters)</label>
                    <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" className={`w-full mt-1 px-4 py-3 bg-gray-50 border ${error && password.length < 8 ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none`} />
                  </div>
                  {view === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase">Confirm Password</label>
                      <input required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className={`w-full mt-1 px-4 py-3 bg-gray-50 border ${error && password !== confirmPassword ? 'border-red-400' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none`} />
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95"
              >
                {view === 'register' ? 'Create Account' : 'Sign In'}
              </button>

              {view === 'register' && (
                <p className="text-center text-sm text-gray-500">
                  Already have an account? <button type="button" onClick={() => setView('login')} className="text-blue-600 font-bold">Login</button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
